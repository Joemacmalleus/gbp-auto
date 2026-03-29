/**
 * POST /api/heatmap/auto — Auto-generate keywords from business category and run scans
 * GET  /api/heatmap/auto — Get auto-generated keywords for the business (without running)
 *
 * This endpoint makes the heatmap zero-input: it derives keywords from
 * the connected GBP's primary category and scans all of them.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import {
  generateGrid,
  queryRankAtPoint,
  computeHeatmapStats,
  generateKeywordsFromCategory,
} from "@/lib/heatmap";

// ─── GET: Return suggested keywords for the business ─────────
export async function GET() {
  try {
    const user = await requireSession();
    const business = user.businesses?.[0];
    if (!business) {
      return NextResponse.json({ keywords: [], business: null });
    }

    const keywords = generateKeywordsFromCategory(business.category, business.name);

    // Check which keywords already have scans
    const existingScans = await prisma.heatmapSearch.findMany({
      where: { businessId: business.id },
      select: { keyword: true, createdAt: true, visibility: true, status: true },
      orderBy: { createdAt: "desc" },
    });

    const scannedKeywords = new Set(existingScans.map((s) => s.keyword.toLowerCase()));

    return NextResponse.json({
      keywords,
      category: business.category,
      business: { name: business.name, id: business.id },
      alreadyScanned: keywords.filter((k) => scannedKeywords.has(k.toLowerCase())),
      needsScan: keywords.filter((k) => !scannedKeywords.has(k.toLowerCase())),
    });
  } catch (e: any) {
    if (e?.statusCode === 401) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("GET /api/heatmap/auto error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ─── POST: Run auto-scan for all category keywords ───────────
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

    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json({ error: "Google Places API key not configured" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const gridSize = Math.min(Math.max(body.gridSize || 5, 3), 9);
    const radiusKm = Math.min(Math.max(body.radiusKm || 5, 1), 20);

    // Generate keywords from category
    const keywords = generateKeywordsFromCategory(business.category, business.name);

    // Check which ones have already been scanned in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentScans = await prisma.heatmapSearch.findMany({
      where: {
        businessId: business.id,
        keyword: { in: keywords },
        createdAt: { gte: oneDayAgo },
        status: "COMPLETED",
      },
      select: { keyword: true },
    });
    const recentKeywords = new Set(recentScans.map((s) => s.keyword.toLowerCase()));

    // Filter to only unscanned keywords (or allow force-rescan)
    const forceRescan = body.force === true;
    const keywordsToScan = forceRescan
      ? keywords
      : keywords.filter((k) => !recentKeywords.has(k.toLowerCase()));

    if (keywordsToScan.length === 0) {
      // Return existing scan results instead
      const existing = await prisma.heatmapSearch.findMany({
        where: {
          businessId: business.id,
          keyword: { in: keywords },
          status: "COMPLETED",
        },
        orderBy: { createdAt: "desc" },
        include: { points: { orderBy: [{ gridRow: "asc" }, { gridCol: "asc" }] } },
      });

      // Deduplicate: keep only most recent scan per keyword
      const seen = new Set<string>();
      const deduped = existing.filter((h) => {
        const key = h.keyword.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return NextResponse.json({
        heatmaps: deduped,
        skipped: keywords.length,
        scanned: 0,
        message: "All keywords were scanned recently. Showing cached results.",
      });
    }

    // Run scans for each keyword
    const completedHeatmaps = [];

    for (const keyword of keywordsToScan) {
      try {
        // Create record
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

        // Generate grid
        const gridPoints = generateGrid(business.latitude, business.longitude, gridSize, radiusKm);

        // Query each point in batches of 5
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
              } catch {
                return { ...point, rank: null, totalResults: 0, topCompetitor: null };
              }
            })
          );
          results.push(...batchResults);

          if (i + BATCH_SIZE < gridPoints.length) {
            await new Promise((r) => setTimeout(r, 200));
          }
        }

        // Store points
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

        // Compute stats
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
          include: { points: { orderBy: [{ gridRow: "asc" }, { gridCol: "asc" }] } },
        });

        completedHeatmaps.push(updated);

        // Small delay between keyword scans
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(`Auto-scan failed for keyword "${keyword}":`, err);
      }
    }

    // Log activity
    if (completedHeatmaps.length > 0) {
      const avgVisibility = Math.round(
        completedHeatmaps.reduce((sum, h) => sum + (h.visibility ?? 0), 0) / completedHeatmaps.length
      );
      await prisma.activity.create({
        data: {
          businessId: business.id,
          type: "RANKING_CHECKED",
          title: `Auto heatmap scan: ${completedHeatmaps.length} keywords`,
          detail: `Average visibility: ${avgVisibility}%. Keywords: ${completedHeatmaps.map((h) => h.keyword).join(", ")}`,
        },
      });
    }

    return NextResponse.json({
      heatmaps: completedHeatmaps,
      scanned: completedHeatmaps.length,
      skipped: keywords.length - keywordsToScan.length,
    });
  } catch (e: any) {
    if (e?.statusCode === 401) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("POST /api/heatmap/auto error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
