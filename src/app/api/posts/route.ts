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

  const posts = await prisma.post.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ posts });
});

export const GET = handler;
