import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { ensureValidToken, listLocations, parseLocation, listReviews } from "@/lib/google";
import { prisma } from "@/lib/db";
import { runOptimizationAudit } from "@/lib/ai";
import {
  withErrorHandler,
  createAuthError,
  createValidationError,
  createNotFoundError,
  createExternalServiceError,
} from "@/lib/errors";
import { validateRequestBody, validateRequired, validateString } from "@/lib/validate";

const handler = withErrorHandler(async (req: NextRequest) => {
  const user = await requireSession();
  const body = await req.json();

  // Validate input
  const validation = validateRequestBody(body, [
    { field: "accountId", validate: (v) => validateRequired(v, "accountId") || validateString(v, "accountId") },
    { field: "locationId", validate: (v) => validateRequired(v, "locationId") || validateString(v, "locationId") },
  ]);
  if (!validation.valid) {
    throw createValidationError("Invalid request", { errors: validation.errors });
  }

  const { accountId, locationId } = body as { accountId: string; locationId: string };

  if (!user.accessToken) {
    throw createAuthError("No Google token");
  }

  // Ensure token is fresh
  const validToken = await ensureValidToken(user);

  // Fetch location details
  const locations = await listLocations(validToken, accountId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawLocation = locations.find((l: any) => l.name === locationId);
  if (!rawLocation) {
    throw createNotFoundError("Location not found");
  }

  const loc = parseLocation(rawLocation);

  // Fetch review stats for audit
  let reviewData: { reviews: unknown[]; averageRating: number | undefined; totalReviewCount: number | undefined } = {
    reviews: [],
    averageRating: 0,
    totalReviewCount: 0,
  };
  try {
    reviewData = await listReviews(validToken, locationId);
  } catch {
    // Reviews API may not be available for all locations
  }

  // Count how many reviews have owner responses
  const respondedCount = (reviewData.reviews as Record<string, unknown>[]).filter(
    (r) => r.reviewReply
  ).length;
  const responseRate =
    (reviewData.totalReviewCount ?? 0) > 0
      ? respondedCount / (reviewData.totalReviewCount ?? 1)
      : 0;

  // Run AI optimization audit
  let audit;
  try {
    audit = await runOptimizationAudit({
      businessName: loc.title,
      category: loc.category || "Unknown",
      description: loc.description || null,
      phone: loc.phone || null,
      website: loc.website || null,
      address: loc.address || null,
      hasPhotos: false,
      photoCount: 0,
      postCount: 0,
      lastPostDate: null,
      reviewCount: reviewData.totalReviewCount ?? 0,
      averageRating: reviewData.averageRating ?? 0,
      responseRate,
      hasHours: !!(rawLocation as Record<string, unknown>).regularHours,
      hasAttributes: false,
    });
  } catch (error) {
    console.error("Audit generation error:", error);
    throw createExternalServiceError("Failed to run optimization audit");
  }

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
      auditJson: audit as unknown as Record<string, unknown>,
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
      auditJson: audit as unknown as Record<string, unknown>,
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
});

export const POST = handler;
