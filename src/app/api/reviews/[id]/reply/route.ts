import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { replyToReview } from "@/lib/google";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const body = await req.json();

    const review = await prisma.review.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!review || !user.accessToken) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Use custom reply if provided, otherwise use AI draft
    const replyText = body.reply || review.aiDraftReply;
    if (!replyText) {
      return NextResponse.json({ error: "No reply text" }, { status: 400 });
    }

    // Post reply to Google
    await replyToReview(user.accessToken, review.gbpReviewId, replyText);

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
  } catch (error) {
    console.error("Reply error:", error);
    return NextResponse.json({ error: "Reply failed" }, { status: 500 });
  }
}
