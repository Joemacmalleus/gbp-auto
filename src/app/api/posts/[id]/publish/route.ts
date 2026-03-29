import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ensureValidToken, createLocalPost } from "@/lib/google";
import {
  withErrorHandler,
  createAuthError,
  createNotFoundError,
  createExternalServiceError,
} from "@/lib/errors";

const handler = withErrorHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const user = await requireSession();
    const { id } = await context.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!post) {
      throw createNotFoundError("Post not found");
    }

    if (!post.business.gbpLocationId || !user.accessToken) {
      throw createAuthError("Not connected to Google Business Profile");
    }

    // Ensure token is fresh
    const validToken = await ensureValidToken(user);

    try {
      const result = await createLocalPost(
        validToken,
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
          gbpPostId: (result as Record<string, unknown>)?.name as string | undefined,
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
      await prisma.post.update({
        where: { id },
        data: { status: "FAILED" },
      });

      throw createExternalServiceError("Failed to publish post to Google");
    }
  }
);

export const POST = handler;
