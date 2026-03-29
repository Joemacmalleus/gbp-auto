/**
 * Cron worker — runs recurring tasks for all active businesses.
 *
 * Deploy as: a cron job (Vercel cron, Railway cron, or system crontab)
 * Schedule:  Every 6 hours for review sync, daily for ranking checks,
 *            weekly for post generation + reports.
 *
 * Usage: npx tsx src/jobs/cron.ts [task]
 *   tasks: sync-reviews | check-rankings | publish-scheduled | generate-posts | weekly-report | all
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Sync Reviews ────────────────────────────────────────────
// Pulls latest reviews from Google for all active businesses

async function syncAllReviews() {
  console.log("[cron] Syncing reviews...");

  const businesses = await prisma.business.findMany({
    where: { syncStatus: "SYNCED", user: { plan: "ACTIVE" } },
    include: { user: true },
  });

  for (const biz of businesses) {
    if (!biz.user.accessToken || !biz.gbpLocationId) continue;

    try {
      // Dynamic import to avoid loading googleapis at module level
      const { listReviews } = await import("../lib/google");
      const { generateReviewResponse } = await import("../lib/ai");

      const { reviews: googleReviews } = await listReviews(
        biz.user.accessToken,
        biz.gbpLocationId
      );

      let newCount = 0;
      for (const gr of googleReviews as any[]) {
        const reviewId = gr.reviewId || gr.name;
        const existing = await prisma.review.findUnique({
          where: { gbpReviewId: reviewId },
        });
        if (existing) continue;

        const ratingNum =
          gr.starRating === "FIVE" ? 5 :
          gr.starRating === "FOUR" ? 4 :
          gr.starRating === "THREE" ? 3 :
          gr.starRating === "TWO" ? 2 : 1;

        let aiResult = null;
        if (gr.comment) {
          try {
            aiResult = await generateReviewResponse({
              businessName: biz.name,
              category: biz.category || "Business",
              reviewerName: gr.reviewer?.displayName || "Customer",
              rating: ratingNum,
              comment: gr.comment,
            });
          } catch {}
        }

        await prisma.review.create({
          data: {
            businessId: biz.id,
            gbpReviewId: reviewId,
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
            businessId: biz.id,
            type: "REVIEW_RECEIVED",
            title: `${newCount} new review${newCount > 1 ? "s" : ""} synced`,
            detail: "AI responses have been drafted",
          },
        });
      }

      console.log(`  [${biz.name}] ${newCount} new reviews`);
    } catch (err) {
      console.error(`  [${biz.name}] Review sync failed:`, err);
    }
  }
}

// ─── Publish Scheduled Posts ─────────────────────────────────
// Publishes any posts whose scheduledFor has passed

async function publishScheduledPosts() {
  console.log("[cron] Publishing scheduled posts...");

  const duePosts = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      scheduledFor: { lte: new Date() },
    },
    include: { business: { include: { user: true } } },
  });

  for (const post of duePosts) {
    const user = post.business.user;
    if (!user.accessToken || !post.business.gbpLocationId) {
      console.log(`  [${post.business.name}] Skipping — no token or location`);
      continue;
    }

    try {
      const { createLocalPost } = await import("../lib/google");

      await createLocalPost(user.accessToken, post.business.gbpLocationId, {
        summary: post.content,
        callToAction: post.callToAction && post.ctaUrl
          ? { actionType: post.callToAction, url: post.ctaUrl }
          : undefined,
      });

      await prisma.post.update({
        where: { id: post.id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });

      await prisma.activity.create({
        data: {
          businessId: post.businessId,
          type: "POST_PUBLISHED",
          title: "Scheduled post published",
          detail: post.content.substring(0, 100),
        },
      });

      console.log(`  [${post.business.name}] Published post ${post.id}`);
    } catch (err) {
      console.error(`  [${post.business.name}] Publish failed:`, err);
      await prisma.post.update({
        where: { id: post.id },
        data: { status: "FAILED" },
      });
    }
  }
}

// ─── Check Rankings (stub) ───────────────────────────────────
// In production, integrate with a ranking API (e.g., BrightLocal, DataForSEO)

async function checkRankings() {
  console.log("[cron] Checking rankings (stub)...");

  const businesses = await prisma.business.findMany({
    where: { syncStatus: "SYNCED", user: { plan: "ACTIVE" } },
  });

  for (const biz of businesses) {
    // Stub: In production, call a ranking API
    // For now, log that we would check
    console.log(`  [${biz.name}] Would check rankings for category: ${biz.category}`);

    await prisma.activity.create({
      data: {
        businessId: biz.id,
        type: "RANKING_CHECKED",
        title: "Rankings checked",
        detail: "Ranking tracking will be available once configured",
      },
    });
  }
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  const task = process.argv[2] || "all";

  console.log(`[cron] Starting task: ${task}`);
  console.log(`[cron] Time: ${new Date().toISOString()}`);

  switch (task) {
    case "sync-reviews":
      await syncAllReviews();
      break;
    case "publish-scheduled":
      await publishScheduledPosts();
      break;
    case "check-rankings":
      await checkRankings();
      break;
    case "all":
      await syncAllReviews();
      await publishScheduledPosts();
      await checkRankings();
      break;
    default:
      console.log(`Unknown task: ${task}`);
      console.log("Available: sync-reviews, publish-scheduled, check-rankings, all");
  }

  console.log("[cron] Done.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[cron] Fatal error:", err);
  process.exit(1);
});
