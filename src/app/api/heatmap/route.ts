/**
 * POST /api/heatmap — Start a new heatmap search
 * GET  /api/heatmap — List heatmap searches for the user's business
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { generateGrid, queryRankAtPoint, computeHeatmapStats } from "@/lib/heatmap";

// ─── GET: List heatmaps ──────────────────────────────────────
export async function GET() {
  try {
    const user = await requireSession();
    const business = user.businesses?.[0];
    if (!business) {
      return NextResponse.json({ heatmaps: [] });
    }

    const heatmaps = await prisma.heatmapSearch.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: { select: { points: true } },
      },
    });

    return NextResponse.json({ heatmaps });
  } catch (e: any) {
    if (e?.statusCode === 401) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("GET /api/heatmap error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ─── POST: Create + run a heatmap search ─────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const business = user.businesses?.[0];

    if (!business) {
      return NextResponse.json({ error: "No business connected" }, { status: 400 });
    }

    if (!business.latitude || !business.longitude) {
      return NextResponse.json(
        { error: "Business location not set. Please sync your GBP first." },
        { status: 400 }
      );
    }

    if (!business.gbpPlaceId) {
      return NextResponse.json(
        { error: "Business Place ID not set. Please reconnect your GBP." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const keyword = body.keyword?.trim();
    const gridSize = Math.min(Math.max(body.gridSize || 7, 3), 9); // 3-9
    const radiusKm = Math.min(Math.max(body.radiusKm || 5, 1), 20); // 1-20km

    if (!keyword || keyword.length < 2) {
      return NextResponse.json({ error: "Keyword is required (min 2 characters)" }, { status: 400 });
    }

    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_CLIENT_ID;
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json({ error: "Google Places API key not configured" }, { status: 500 });
    }

    // Create the heatmap record
    const heatmap = await prisma.heatmapSearch.create({
      data: {
        businessId: business.id,
        keyword,
        gridSize,
        radiusKm,
        centerLat: business.latitude,
        centerLng: business.longitude,
        status: "RUNNING",
      },
    });

    // Generate grid points
    const gridPoints = generateGrid(business.latitude, business.longitude, gridSize, radiusKm);

    // Query each point (in batches of 5 to respect rate limits)
    const results: Array<{
      row: number;
      col: number;
      lat: number;
      lng: number;
      rank: number | null;
      totalResults: number;
      topCompetitor: string | null;
    }> = [];

    const BATCH_SIZE = 5;
    for (let i = 0; i < gridPoints.length; i += BATCH_SIZE) {
      const batch = gridPoints.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (point) => {
          try {
            const result = await queryRankAtPoint(
              keyword,
              point.lat,
              point.lng,
              business.gbpPlaceId!,
              GOOGLE_PLACES_API_KEY
            );
            return { ...point, ...result };
          } catch (err) {
            console.error(`Heatmap query failed at (${point.lat},${point.lng}):`, err);
            return { ...point, rank: null, totalResults: 0, topCompetitor: null };
          }
        })
      );
      results.push(...batchResults);

      // Small delay between batches to respect rate limits
      if (i + BATCH_SIZE < gridPoints.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    // Store all points
    await prisma.heatmapPoint.createMany({
      data: results.map((r) => ({
        heatmapSearchId: heatmap.id,
        gridRow: r.row,
        gridCol: r.col,
        latitude: r.lat,
        longitude: r.lng,
        rank: r.rank,
        totalResults: r.totalResults,
        topCompetitor: r.topCompetitor,
      })),
    });

    // Compute and store statistics
    const stats = computeHeatmapStats(results);

    const updated = await prisma.heatmapSearch.update({
      where: { id: heatmap.id },
      data: {
        status: "COMPLETED",
        avgRank: stats.avgRank,
        bestRank: stats.bestRank,
        worstRank: stats.worstRank,
        visibility: stats.visibility,
      },
      include: { points: true },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        businessId: business.id,
        type: "RANKING_CHECKED",
        title: `Heatmap scan: "${keyword}"`,
        detail: stats.visibility > 0
          ? `Visible in ${stats.visibility}% of grid. Best rank: #${stats.bestRank}, Avg: #${stats.avgRank}`
          : "Not found in any grid points for this keyword",
      },
    });

    return NextResponse.json({ heatmap: updated });
  } catch (e: any) {
    if (e?.statusCode === 401) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("POST /api/heatmap error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
