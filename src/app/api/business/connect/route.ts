import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { listLocations, parseLocation, listReviews } from "@/lib/google";
import { prisma } from "@/lib/db";
import { runOptimizationAudit } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const { accountId, locationId } = await req.json();

    if (!user.accessToken) {
      return NextResponse.json({ error: "No Google token" }, { status: 401 });
    }

    // Fetch location details
    const locations = await listLocations(user.accessToken, accountId);
    const rawLocation = locations.find((l: any) => l.name === locationId);
    if (!rawLocation) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    const loc = parseLocation(rawLocation);

    // Fetch review stats for audit
    let reviewData = { reviews: [], averageRating: 0, totalReviewCount: 0 };
    try {
      reviewData = await listReviews(user.accessToken, locationId);
    } catch {
      // Reviews API may not be available for all locations
    }

    // Count how many reviews have owner responses
    const respondedCount = (reviewData.reviews as any[]).filter(
      (r: any) => r.reviewReply
    ).length;
    const responseRate =
      reviewData.totalReviewCount > 0
        ? respondedCount / reviewData.totalReviewCount
        : 0;

    // Run AI optimization audit
    const audit = await runOptimizationAudit({
      businessName: loc.title,
      category: loc.category || "Unknown",
      description: loc.description || null,
      phone: loc.phone || null,
      website: loc.website || null,
      address: loc.address || null,
      hasPhotos: false, // Can't determine from API alone
      photoCount: 0,
      postCount: 0,
      lastPostDate: null,
      reviewCount: reviewData.totalReviewCount,
      averageRating: reviewData.averageRating || 0,
      responseRate,
      hasHours: !!(rawLocation as any).regularHours,
      hasAttributes: false,
    });

    // Create business record
    const business = await prisma.business.upsert({
      where: {
        userId_gbpLocationId: {
          userId: user.id,
          gbpLocationId: locationId,
        },
      },
      update: {
        name: loc.title,
        category: loc.category,
        phone: loc.phone,
        website: loc.website,
        address: loc.address,
        description: loc.description,
        gbpPlaceId: loc.placeId,
        latitude: loc.latitude,
        longitude: loc.longitude,
        optimizationScore: audit.overallScore,
        auditJson: audit as any,
        lastAuditAt: new Date(),
        lastSyncAt: new Date(),
        syncStatus: "SYNCED",
      },
      create: {
        userId: user.id,
        gbpAccountId: accountId,
        gbpLocationId: locationId,
        gbpPlaceId: loc.placeId,
        name: loc.title,
        category: loc.category,
        phone: loc.phone,
        website: loc.website,
        address: loc.address,
        description: loc.description,
        latitude: loc.latitude,
        longitude: loc.longitude,
        optimizationScore: audit.overallScore,
        auditJson: audit as any,
        lastAuditAt: new Date(),
        lastSyncAt: new Date(),
        syncStatus: "SYNCED",
      },
    });

    // Log activity
    await prisma.activity.createMany({
      data: [
        {
          businessId: business.id,
          type: "PROFILE_CONNECTED",
          title: "Business profile connected",
          detail: `${loc.title} is now linked to GBP Auto`,
        },
        {
          businessId: business.id,
          type: "AUDIT_COMPLETED",
          title: `Optimization audit complete: ${audit.overallScore}/100`,
          detail: audit.topPriorities[0],
        },
      ],
    });

    return NextResponse.json({ business, audit });
  } catch (error) {
    console.error("Connect error:", error);
    return NextResponse.json({ error: "Failed to connect" }, { status: 500 });
  }
}
