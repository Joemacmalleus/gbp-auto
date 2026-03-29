import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ensureValidToken, replyToReview } from "@/lib/google";
import {
  withErrorHandler,
  createAuthError,
  createNotFoundError,
  createValidationError,
  createExternalServiceError,
} from "@/lib/errors";

const handler = withErrorHandler(
  async (
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const user = await requireSession();
    const { id } = await context.params;
    const body = await req.json();

    const review = await prisma.review.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!review) {
      throw createNotFoundError("Review not found");
    }

    if (!user.accessToken) {
      throw createAuthError("Not connected to Google");
    }

    // Use custom reply if provided, otherwise use AI draft
    const replyText = (body.reply as string) || review.aiDraftReply;
    if (!replyText) {
      throw createValidationError("No reply text provided");
    }

    // Ensure token is fresh
    const validToken = await ensureValidToken(user);

    try {
      await replyToReview(validToken, review.gbpReviewId, replyText);
    } catch (error) {
      console.error("Reply error:", error);
      throw createExternalServiceError("Failed to post reply to Google");
    }

    // Update our record
    await prisma.review.update({
      where: { id },
      data: {
        finalReply: replyText,
        replyStatus: "PUBLISHED",
        repliedAt: new Date(),
      },
    });

    await prisma.activity.create({
      data: {
        businessId: review.businessId,
        type: "REVIEW_REPLIED",
        title: `Replied to ${review.reviewerName}'s ${review.rating}-star review`,
      },
    });

    return NextResponse.json({ ok: true });
  }
);

export const POST = handler;
