import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { generateReviewResponse } from "@/lib/ai";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await generateReviewResponse({
      businessName: review.business.name,
      category: review.business.category || "Business",
      reviewerName: review.reviewerName,
      rating: review.rating,
      comment: review.comment || "",
    });

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
  } catch (error) {
    console.error("Generate reply error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
