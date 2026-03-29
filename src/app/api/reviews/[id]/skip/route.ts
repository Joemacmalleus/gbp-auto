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

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw createNotFoundError("Review not found");
    }

    await prisma.review.update({
      where: { id },
      data: { replyStatus: "SKIPPED" },
    });

    return NextResponse.json({ ok: true });
  }
);

export const POST = handler;
