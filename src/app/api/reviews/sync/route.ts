import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { listReviews } from "@/lib/google";
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

  let googleReviews: any[] = [];
  try {
    // Fetch reviews from Google
    const result = await listReviews(user.accessToken, business.gbpLocationId);
    googleReviews = result.reviews || [];
  } catch (error) {
    console.error("Google API error:", error);
    throw createExternalServiceError(
      "Failed to sync reviews from Google Business Profile"
    );
  }

  let newCount = 0;

  for (const gr of googleReviews) {
    const existing = await prisma.review.findUnique({
      where: { gbpReviewId: gr.reviewId || gr.name },
    });

    if (existing) continue; // Already synced

    // Generate AI response for new reviews
    let aiResult = null;
    if (gr.comment) {
      try {
        aiResult = await generateReviewResponse({
          businessName: business.name,
          category: business.category || "Business",
          reviewerName: gr.reviewer?.displayName || "Customer",
          rating:
            gr.starRating === "FIVE"
              ? 5
              : gr.starRating === "FOUR"
                ? 4
                : gr.starRating === "THREE"
                  ? 3
                  : gr.starRating === "TWO"
                    ? 2
                    : 1,
          comment: gr.comment,
        });
      } catch (error) {
        console.error("AI generation error for review:", error);
        // AI generation failed, will leave draft empty
      }
    }

    const ratingNum =
      gr.starRating === "FIVE"
        ? 5
        : gr.starRating === "FOUR"
          ? 4
          : gr.starRating === "THREE"
            ? 3
            : gr.starRating === "TWO"
              ? 2
              : 1;

    await prisma.review.create({
      data: {
        businessId: business.id,
        gbpReviewId: gr.reviewId || gr.name,
        reviewerName: gr.reviewer?.displayName || "Anonymous",
        reviewerPhoto: gr.reviewer?.profilePhotoUrl,
        rating: ratingNum,
        comment: gr.comment || null,
        publishedAt: new Date(gr.createTime || gr.updateTime),
        aiDraftReply: aiResult?.reply || null,
        replyStatus: aiResult ? "AI_DRAFTED" : "UNREAD",
        sentiment: (aiResult?.sentiment as any) || null,
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
