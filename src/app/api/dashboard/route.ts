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

  // Parallel queries with pagination to avoid loading full dataset into memory
  const [activities, posts, recentReviews, reviewStats, rankings] = await Promise.all([
    prisma.activity.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.post.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 50, // Last 50 posts instead of all
    }),
    prisma.review.findMany({
      where: { businessId: business.id },
      orderBy: { publishedAt: "desc" },
      take: 50, // Last 50 reviews for display
    }),
    // Aggregate stats via DB instead of loading all records
    prisma.review.aggregate({
      where: { businessId: business.id },
      _avg: { rating: true },
      _count: { id: true },
    }),
    prisma.rankingSnapshot.findMany({
      where: { businessId: business.id },
      orderBy: { checkedAt: "desc" },
      take: 50,
    }),
  ]);

  // Count unreplied reviews efficiently
  const unrepliedCount = await prisma.review.count({
    where: {
      businessId: business.id,
      replyStatus: { in: ["UNREAD", "AI_DRAFTED"] },
    },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const postsThisMonth = posts.filter(
    (p) => p.status === "PUBLISHED" && p.publishedAt && p.publishedAt >= startOfMonth
  ).length;

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
      reviewsTotal: reviewStats._count.id,
      reviewsUnreplied: unrepliedCount,
      averageRating: reviewStats._avg.rating ?? 0,
      avgRanking,
    },
    activities,
    upcomingPosts,
    recentReviews: recentReviews.slice(0, 10), // Top 10 for quick display
  });
});

export const GET = handler;
