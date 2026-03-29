import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { runOptimizationAudit } from "@/lib/ai";
import { listReviews } from "@/lib/google";

export async function POST() {
  try {
    const user = await requireSession();
    const business = user.businesses[0];

    if (!business || !user.accessToken) {
      return NextResponse.json({ error: "Not connected" }, { status: 400 });
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

    const audit = await runOptimizationAudit({
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
  } catch (error) {
    console.error("Audit error:", error);
    return NextResponse.json({ error: "Audit failed" }, { status: 500 });
  }
}
