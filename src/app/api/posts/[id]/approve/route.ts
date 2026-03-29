import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;

    const post = await prisma.post.update({
      where: { id },
      data: {
        status: "SCHEDULED", // Auto-schedule if scheduledFor is set
      },
    });

    // If post has a scheduledFor date, keep it as SCHEDULED. Otherwise APPROVED.
    if (!post.scheduledFor) {
      await prisma.post.update({
        where: { id },
        data: { status: "APPROVED" },
      });
    }

    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
