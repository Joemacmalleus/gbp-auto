/**
 * GET /api/heatmap/[id] — Get a specific heatmap with all points
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function GET(
  req: NextRequest,
  context: any
) {
  try {
    const user = await requireSession();
    const { id } = await context.params;

    const heatmap = await prisma.heatmapSearch.findUnique({
      where: { id },
      include: {
        points: {
          orderBy: [{ gridRow: "asc" }, { gridCol: "asc" }],
        },
        business: {
          select: { id: true, userId: true, name: true },
        },
      },
    });

    if (!heatmap) {
      return NextResponse.json({ error: "Heatmap not found" }, { status: 404 });
    }

    // Verify ownership
    if (heatmap.business.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ heatmap });
  } catch (e: any) {
    if (e?.statusCode === 401) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("GET /api/heatmap/[id] error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
