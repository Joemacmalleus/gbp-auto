import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { generateReviewResponse } from "@/lib/ai";
import {
  withErrorHandler,
  createNotFoundError,
  createExternalServiceError,
} from "@/lib/errors";
import { rateLimiters, getClientIP } from "@/lib/rate-limit";

const handler = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    // Rate limiting for AI generation endpoints
    const clientIP = getClientIP(req);
    const limiterResult = rateLimiters.aiGeneration(clientIP);
    if (!limiterResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before generating another reply.",
          retryAfter: limiterResult.retryAfter,
        },
        { status: 429, headers: { "Retry-After": String(limiterResult.retryAfter) } }
      );
    }

    await requireSession();
    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!review) {
      throw createNotFoundError("Review not found");
    }

    let result;
    try {
      result = await generateReviewResponse({
        businessName: review.business.name,
        category: review.business.category || "Business",
        reviewerName: review.reviewerName,
        rating: review.rating,
        comment: review.comment || "",
      });
    } catch (error) {
      console.error("AI generation error:", error);
      throw createExternalServiceError(
        "Failed to generate reply. Please try again later."
      );
    }

    await prisma.review.update({
      where: { id },
      data: {
        aiDraftReply: result.reply,
        replyStatus: "AI_DRAFTED",
        sentiment: result.sentiment as any,
        keywords: result.keywords,
      },
    });

    return NextResponse.json({ reply: result.reply });
  }
);

export const POST = handler;
