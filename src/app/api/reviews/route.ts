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

  const reviews = await prisma.review.findMany({
    where: { businessId: business.id },
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json({ reviews });
});

export const GET = handler;
