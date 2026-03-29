import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { runOptimizationAudit } from "@/lib/ai";
import {
  withErrorHandler,
  createAuthzError,
  createExternalServiceError,
} from "@/lib/errors";
import { rateLimiters, getClientIP } from "@/lib/rate-limit";

const handler = withErrorHandler(async (req: NextRequest) => {
  // Rate limiting for audit operations (moderate limit)
  const clientIP = getClientIP(req);
  const limiterResult = rateLimiters.sync(clientIP);
  if (!limiterResult.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please wait before running another audit.",
        retryAfter: limiterResult.retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(limiterResult.retryAfter) } }
    );
  }

  const user = await requireSession();
  const business = user.businesses[0];

  if (!business) {
    throw createAuthzError("No business connected");
  }

  // Gather current state
  const [reviews, posts] = await Promise.all([
    prisma.review.findMany({ where: { businessId: business.id } }),
    prisma.post.findMany({
      where: { businessId: business.id, status: "PUBLISHED" },
    }),
  ]);

  const respondedReviews = reviews.filter(
    (r) => r.replyStatus === "PUBLISHED"
  ).length;
  const responseRate = reviews.length > 0 ? respondedReviews / reviews.length : 0;
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const lastPost = posts.sort(
    (a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0)
  )[0];

  let audit;
  try {
    audit = await runOptimizationAudit({
      businessName: business.name,
      category: business.category || "Unknown",
      description: business.description,
      phone: business.phone,
      website: business.website,
      address: business.address,
      hasPhotos: false,
      photoCount: 0,
      postCount: posts.length,
      lastPostDate: lastPost?.publishedAt?.toISOString() || null,
      reviewCount: reviews.length,
      averageRating: avgRating,
      responseRate,
      hasHours: true,
      hasAttributes: false,
    });
  } catch (error) {
    console.error("Audit generation error:", error);
    throw createExternalServiceError(
      "Failed to run optimization audit. Please try again later."
    );
  }

  await prisma.business.update({
    where: { id: business.id },
    data: {
      optimizationScore: audit.overallScore,
      auditJson: audit as any,
      lastAuditAt: new Date(),
    },
  });

  await prisma.activity.create({
    data: {
      businessId: business.id,
      type: "AUDIT_COMPLETED",
      title: `Optimization audit updated: ${audit.overallScore}/100`,
      detail: audit.topPriorities[0],
    },
  });

  return NextResponse.json({ audit });
});

export const POST = handler;
