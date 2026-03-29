/**
 * Local Rank Grid Heatmap Engine
 *
 * Generates a geographic grid around a business location and queries
 * Google Places API (Text Search) at each grid point to find the
 * business's ranking position for a given keyword.
 *
 * Similar to Local Falcon / Search Atlas heatmap functionality.
 */

// ─── Grid Generation ─────────────────────────────────────────

interface GridPoint {
  row: number;
  col: number;
  lat: number;
  lng: number;
}

/**
 * Generate an NxN grid of lat/lng points centered on a location.
 * Uses equirectangular approximation (good enough for <50km grids).
 */
export function generateGrid(
  centerLat: number,
  centerLng: number,
  gridSize: number,
  radiusKm: number
): GridPoint[] {
  const points: GridPoint[] = [];

  // Convert km to degrees (approximate)
  const latDegPerKm = 1 / 111.32;
  const lngDegPerKm = 1 / (111.32 * Math.cos((centerLat * Math.PI) / 180));

  const radiusLat = radiusKm * latDegPerKm;
  const radiusLng = radiusKm * lngDegPerKm;

  const step = gridSize > 1 ? 2 / (gridSize - 1) : 0; // -1 to 1 range

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const normalizedRow = gridSize > 1 ? -1 + row * step : 0;
      const normalizedCol = gridSize > 1 ? -1 + col * step : 0;

      points.push({
        row,
        col,
        lat: centerLat + normalizedRow * radiusLat,
        lng: centerLng + normalizedCol * radiusLng,
      });
    }
  }

  return points;
}

// ─── Google Places API Query ─────────────────────────────────

interface PlacesResult {
  rank: number | null;        // null = not found in top 20
  totalResults: number;
  topCompetitor: string | null;
}

/**
 * Query Google Places Text Search API at a specific location
 * and find the rank of a target business (by Place ID).
 */
export async function queryRankAtPoint(
  keyword: string,
  lat: number,
  lng: number,
  targetPlaceId: string,
  apiKey: string
): Promise<PlacesResult> {
  // Use the Places API (New) Text Search with location bias
  const url = "https://places.googleapis.com/v1/places:searchText";

  const body = {
    textQuery: keyword,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 2000.0, // 2km radius for each grid point
      },
    },
    maxResultCount: 20,
    languageCode: "en",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`Places API error at (${lat},${lng}):`, err);
    return { rank: null, totalResults: 0, topCompetitor: null };
  }

  const data = await response.json();
  const places = data.places || [];

  // Find our business in results by Place ID
  let rank: number | null = null;
  let topCompetitor: string | null = null;

  for (let i = 0; i < places.length; i++) {
    const placeId = places[i].id;
    const name = places[i].displayName?.text || "Unknown";

    if (placeId === targetPlaceId) {
      rank = i + 1; // 1-based rank
    }
    if (i === 0 && placeId !== targetPlaceId) {
      topCompetitor = name;
    }
  }

  // If we're #1, the top competitor is #2
  if (rank === 1 && places.length > 1) {
    topCompetitor = places[1].displayName?.text || null;
  }

  return {
    rank,
    totalResults: places.length,
    topCompetitor,
  };
}

// ─── Heatmap Statistics ──────────────────────────────────────

interface HeatmapStats {
  avgRank: number | null;
  bestRank: number | null;
  worstRank: number | null;
  visibility: number;
}

export function computeHeatmapStats(
  points: Array<{ rank: number | null }>
): HeatmapStats {
  const rankedPoints = points.filter((p) => p.rank !== null);

  if (rankedPoints.length === 0) {
    return { avgRank: null, bestRank: null, worstRank: null, visibility: 0 };
  }

  const ranks = rankedPoints.map((p) => p.rank!);
  const avgRank = Math.round((ranks.reduce((a, b) => a + b, 0) / ranks.length) * 10) / 10;
  const bestRank = Math.min(...ranks);
  const worstRank = Math.max(...ranks);
  const visibility = Math.round((rankedPoints.length / points.length) * 100);

  return { avgRank, bestRank, worstRank, visibility };
}

// ─── Color mapping ───────────────────────────────────────────

export function rankToColor(rank: number | null): string {
  if (rank === null) return "#6B7280"; // gray — not found
  if (rank <= 3) return "#22C55E";      // green — top 3
  if (rank <= 5) return "#84CC16";      // lime — 4-5
  if (rank <= 7) return "#EAB308";      // yellow — 6-7
  if (rank <= 10) return "#F97316";     // orange — 8-10
  if (rank <= 15) return "#EF4444";     // red — 11-15
  return "#991B1B";                      // dark red — 16-20
}
