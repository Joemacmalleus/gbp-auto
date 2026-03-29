import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { withErrorHandler, createNotFoundError } from "@/lib/errors";

const handler = withErrorHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    await requireSession();
    const { id } = await context.params;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw createNotFoundError("Post not found");
    }

    // If post has a scheduledFor date, keep it as SCHEDULED. Otherwise APPROVED.
    const newStatus = post.scheduledFor ? "SCHEDULED" : "APPROVED";

    const updated = await prisma.post.update({
      where: { id },
      data: { status: newStatus },
    });

    return NextResponse.json({ post: updated });
  }
);

export const POST = handler;
