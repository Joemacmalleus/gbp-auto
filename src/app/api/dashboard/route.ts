import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { withErrorHandler, createAuthzError } from "@/lib/errors";

const handler = withErrorHandler(async () => {
  const user = await requireSession();
  const business = user.businesses[0];

  if (!business) {
    throw createAuthzError("No business connected");
  }

  // Parallel queries with eager loading to avoid N+1
  const [activities, posts, reviews, rankings] = await Promise.all([
    prisma.activity.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.post.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.findMany({
      where: { businessId: business.id },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.rankingSnapshot.findMany({
      where: { businessId: business.id },
      orderBy: { checkedAt: "desc" },
      take: 50,
    }),
  ]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const postsThisMonth = posts.filter(
    (p) => p.status === "PUBLISHED" && p.publishedAt && p.publishedAt >= startOfMonth
  ).length;

  const unrepliedReviews = reviews.filter(
    (r) => r.replyStatus === "UNREAD" || r.replyStatus === "AI_DRAFTED"
  ).length;

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  // Latest ranking per keyword, then average
  const latestRankings = new Map<string, number>();
  for (const r of rankings) {
    if (r.position && !latestRankings.has(r.keyword)) {
      latestRankings.set(r.keyword, r.position);
    }
  }
  const avgRanking =
    latestRankings.size > 0
      ? Math.round(
          [...latestRankings.values()].reduce((a, b) => a + b, 0) / latestRankings.size
        )
      : null;

  const upcomingPosts = posts
    .filter((p) => p.status === "DRAFT" || p.status === "APPROVED" || p.status === "SCHEDULED")
    .slice(0, 5);

  return NextResponse.json({
    business: {
      name: business.name,
      category: business.category,
      optimizationScore: business.optimizationScore,
      auditJson: business.auditJson,
      lastAuditAt: business.lastAuditAt,
    },
    stats: {
      postsThisMonth,
      reviewsTotal: reviews.length,
      reviewsUnreplied: unrepliedReviews,
      averageRating: avgRating,
      avgRanking,
    },
    activities,
    upcomingPosts,
  });
});

export const GET = handler;
