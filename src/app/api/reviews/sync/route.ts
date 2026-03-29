import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ensureValidToken, listAllReviews } from "@/lib/google";
import { generateReviewResponse } from "@/lib/ai";
import {
  withErrorHandler,
  createAuthzError,
  createExternalServiceError,
} from "@/lib/errors";
import { rateLimiters, getClientIP } from "@/lib/rate-limit";

const handler = withErrorHandler(async (req: NextRequest) => {
  // Rate limiting for sync operations
  const clientIP = getClientIP(req);
  const limiterResult = rateLimiters.sync(clientIP);
  if (!limiterResult.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: limiterResult.retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(limiterResult.retryAfter) } }
    );
  }

  const user = await requireSession();
  const business = user.businesses[0];

  if (!business?.gbpLocationId || !user.accessToken) {
    throw createAuthzError("Not connected to Google Business Profile");
  }

  // Ensure token is fresh before calling Google
  const validToken = await ensureValidToken(user);

  let googleReviews: Record<string, unknown>[] = [];
  try {
    // Fetch ALL reviews using pagination
    const result = await listAllReviews(validToken, business.gbpLocationId);
    googleReviews = (result.reviews as Record<string, unknown>[]) || [];
  } catch (error) {
    console.error("Google API error:", error);
    throw createExternalServiceError(
      "Failed to sync reviews from Google Business Profile"
    );
  }

  let newCount = 0;

  for (const gr of googleReviews) {
    const reviewId = (gr.reviewId || gr.name) as string;
    const existing = await prisma.review.findUnique({
      where: { gbpReviewId: reviewId },
    });

    if (existing) continue; // Already synced

    // Parse star rating
    const starRating = gr.starRating as string;
    const ratingNum =
      starRating === "FIVE" ? 5
      : starRating === "FOUR" ? 4
      : starRating === "THREE" ? 3
      : starRating === "TWO" ? 2
      : 1;

    // Generate AI response for new reviews with comments
    const comment = gr.comment as string | undefined;
    const reviewer = gr.reviewer as Record<string, string> | undefined;
    let aiResult: { reply: string; sentiment: string; keywords: string[] } | null = null;

    if (comment) {
      try {
        aiResult = await generateReviewResponse({
          businessName: business.name,
          category: business.category || "Business",
          reviewerName: reviewer?.displayName || "Customer",
          rating: ratingNum,
          comment,
        });
      } catch (error) {
        console.error("AI generation error for review:", error);
        // AI generation failed, will leave draft empty
      }
    }

    await prisma.review.create({
      data: {
        businessId: business.id,
        gbpReviewId: reviewId,
        reviewerName: reviewer?.displayName || "Anonymous",
        reviewerPhoto: reviewer?.profilePhotoUrl,
        rating: ratingNum,
        comment: comment || null,
        publishedAt: new Date((gr.createTime || gr.updateTime) as string),
        aiDraftReply: aiResult?.reply || null,
        replyStatus: aiResult ? "AI_DRAFTED" : "UNREAD",
        sentiment: (aiResult?.sentiment as "POSITIVE" | "NEUTRAL" | "NEGATIVE") || null,
        keywords: aiResult?.keywords || [],
      },
    });

    newCount++;
  }

  if (newCount > 0) {
    await prisma.activity.create({
      data: {
        businessId: business.id,
        type: "REVIEW_RECEIVED",
        title: `${newCount} new review${newCount > 1 ? "s" : ""} synced`,
        detail: "AI responses have been drafted — review them in the Reviews tab",
      },
    });
  }

  await prisma.activity.create({
    data: {
      businessId: business.id,
      type: "SYNC_COMPLETED",
      title: "Reviews synced with Google",
      detail: `${newCount} new, ${googleReviews.length} total`,
    },
  });

  return NextResponse.json({
    synced: newCount,
    total: googleReviews.length,
  });
});

export const POST = handler;
