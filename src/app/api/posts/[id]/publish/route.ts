import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createLocalPost } from "@/lib/google";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!post || !post.business.gbpLocationId || !user.accessToken) {
      return NextResponse.json({ error: "Cannot publish" }, { status: 400 });
    }

    // Publish to Google Business Profile
    const result = await createLocalPost(
      user.accessToken,
      post.business.gbpLocationId,
      {
        summary: post.content,
        callToAction: post.callToAction && post.ctaUrl
          ? { actionType: post.callToAction, url: post.ctaUrl }
          : undefined,
      }
    );

    // Update post record
    await prisma.post.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        gbpPostId: (result as any)?.name,
      },
    });

    await prisma.activity.create({
      data: {
        businessId: post.businessId,
        type: "POST_PUBLISHED",
        title: "Post published to Google",
        detail: post.content.substring(0, 100),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Publish error:", error);

    // Mark as failed
    const { id } = await params;
    await prisma.post.update({
      where: { id },
      data: { status: "FAILED" },
    });

    return NextResponse.json({ error: "Publish failed" }, { status: 500 });
  }
}
