import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  withErrorHandler,
  createNotFoundError,
  createValidationError,
} from "@/lib/errors";
import { validateRequired, validateString } from "@/lib/validate";

const patchHandler = withErrorHandler(
  async (
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    await requireSession();
    const { id } = await context.params;
    const body = await req.json();

    const contentError = validateRequired(body.content, "content") || validateString(body.content, "content");
    if (contentError) {
      throw createValidationError(contentError.message);
    }

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      throw createNotFoundError("Post not found");
    }

    const post = await prisma.post.update({
      where: { id },
      data: { content: body.content as string },
    });

    return NextResponse.json({ post });
  }
);

const deleteHandler = withErrorHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    await requireSession();
    const { id } = await context.params;

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      throw createNotFoundError("Post not found");
    }

    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
);

export const PATCH = patchHandler;
export const DELETE = deleteHandler;
