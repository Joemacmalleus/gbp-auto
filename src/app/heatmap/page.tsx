"use client";

import { useEffect, useState, useCallback } from "react";
import AppNav from "@/components/AppNav";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider, useToast } from "@/components/Toast";

// ─── Types ──────────────────────────────────────────────────

interface HeatmapPoint {
  id: string;
  gridRow: number;
  gridCol: number;
  latitude: number;
  longitude: number;
  rank: number | null;
  totalResults: number | null;
  topCompetitor: string | null;
}

interface HeatmapSearch {
  id: string;
  keyword: string;
  gridSize: number;
  radiusKm: number;
  centerLat: number;
  centerLng: number;
  avgRank: number | null;
  bestRank: number | null;
  worstRank: number | null;
  visibility: number | null;
  status: string;
  points: HeatmapPoint[];
  createdAt: string;
}

// ─── Color helpers ──────────────────────────────────────────

function rankToColor(rank: number | null): string {
  if (rank === null) return "#374151"; // gray-700
  if (rank <= 3) return "#22C55E";
  if (rank <= 5) return "#84CC16";
  if (rank <= 7) return "#EAB308";
  if (rank <= 10) return "#F97316";
  if (rank <= 15) return "#EF4444";
  return "#991B1B";
}

function rankToBgClass(rank: number | null): string {
  if (rank === null) return "bg-gray-700";
  if (rank <= 3) return "bg-green-500";
  if (rank <= 5) return "bg-lime-500";
  if (rank <= 7) return "bg-yellow-500";
  if (rank <= 10) return "bg-orange-500";
  if (rank <= 15) return "bg-red-500";
  return "bg-red-900";
}

function rankLabel(rank: number | null): string {
  if (rank === null) return "—";
  return `#${rank}`;
}

// ─── Grid Cell Component ────────────────────────────────────

function GridCell({
  point,
  selected,
  onClick,
}: {
  point: HeatmapPoint;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        aspect-square rounded-lg flex items-center justify-center
        text-white font-bold text-xs sm:text-sm transition-all
        hover:scale-110 hover:z-10 hover:shadow-lg
        ${selected ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110 z-10" : ""}
      `}
      style={{ backgroundColor: rankToColor(point.rank) }}
      title={point.rank ? `#${point.rank}` : "Not found"}
    >
      {point.rank ?? "—"}
    </button>
  );
}

// ─── Heatmap Grid Visualization ─────────────────────────────

function HeatmapGrid({
  heatmap,
  selectedPoint,
  onSelectPoint,
}: {
  heatmap: HeatmapSearch;
  selectedPoint: HeatmapPoint | null;
  onSelectPoint: (point: HeatmapPoint) => void;
}) {
  const gridSize = heatmap.gridSize;

  // Organize points into a 2D grid
  const grid: (HeatmapPoint | null)[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(null)
  );
  heatmap.points.forEach((p) => {
    if (p.gridRow < gridSize && p.gridCol < gridSize) {
      grid[p.gridRow][p.gridCol] = p;
    }
  });

  return (
    <div className="bg-gray-900 rounded-2xl p-4 sm:p-6">
      <div
        className="grid gap-1.5 sm:gap-2 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          maxWidth: `${gridSize * 56}px`,
        }}
      >
        {grid.map((row, r) =>
          row.map((point, c) =>
            point ? (
              <GridCell
                key={`${r}-${c}`}
                point={point}
                selected={selectedPoint?.id === point.id}
                onClick={() => onSelectPoint(point)}
              />
            ) : (
              <div
                key={`${r}-${c}`}
                className="aspect-square rounded-lg bg-gray-800 flex items-center justify-center text-gray-600 text-xs"
              >
                ?
              </div>
            )
          )
        )}
      </div>

      {/* Center marker */}
      <div className="text-center mt-3">
        <span className="text-xs text-gray-400">
          📍 Your business is at the center · {heatmap.radiusKm}km radius
        </span>
      </div>
    </div>
  );
}

// ─── Stats Bar ──────────────────────────────────────────────

function StatsBar({ heatmap }: { heatmap: HeatmapSearch }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs text-gray-500 mb-1">Visibility</div>
        <div className={`text-2xl font-bold ${
          (heatmap.visibility ?? 0) >= 70 ? "text-green-600" :
          (heatmap.visibility ?? 0) >= 40 ? "text-yellow-600" : "text-red-600"
        }`}>
          {heatmap.visibility ?? 0}%
        </div>
        <div className="text-[10px] text-gray-400 mt-1">of grid points</div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs text-gray-500 mb-1">Best Rank</div>
        <div className="text-2xl font-bold text-green-600">
          {heatmap.bestRank ? `#${heatmap.bestRank}` : "—"}
        </div>
        <div className="text-[10px] text-gray-400 mt-1">highest position</div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs text-gray-500 mb-1">Avg Rank</div>
        <div className="text-2xl font-bold text-blue-600">
          {heatmap.avgRank ? `#${heatmap.avgRank}` : "—"}
        </div>
        <div className="text-[10px] text-gray-400 mt-1">across grid</div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs text-gray-500 mb-1">Worst Rank</div>
        <div className="text-2xl font-bold text-orange-600">
          {heatmap.worstRank ? `#${heatmap.worstRank}` : "—"}
        </div>
        <div className="text-[10px] text-gray-400 mt-1">lowest position</div>
      </div>
    </div>
  );
}

// ─── Point Detail Panel ─────────────────────────────────────

function PointDetail({ point }: { point: HeatmapPoint }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-sm mb-3">Grid Point Detail</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: rankToColor(point.rank) }}
          >
            {rankLabel(point.rank)}
          </div>
          <div>
            <div className="text-sm font-medium">
              {point.rank ? `Ranking #${point.rank}` : "Not found in top 20"}
            </div>
            <div className="text-xs text-gray-500">
              Row {point.gridRow + 1}, Col {point.gridCol + 1}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <div>📍 {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}</div>
          <div>📊 {point.totalResults ?? 0} results at this location</div>
          {point.topCompetitor && (
            <div>🏆 Top competitor: {point.topCompetitor}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────

function Legend() {
  const items = [
    { label: "#1–3", color: "#22C55E" },
    { label: "#4–5", color: "#84CC16" },
    { label: "#6–7", color: "#EAB308" },
    { label: "#8–10", color: "#F97316" },
    { label: "#11–15", color: "#EF4444" },
    { label: "#16–20", color: "#991B1B" },
    { label: "Not found", color: "#374151" },
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
          <span className="text-xs text-gray-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page Content ──────────────────────────────────────

function HeatmapContent() {
  const [heatmaps, setHeatmaps] = useState<HeatmapSearch[]>([]);
  const [activeHeatmap, setActiveHeatmap] = useState<HeatmapSearch | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<HeatmapPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [gridSize, setGridSize] = useState(7);
  const [radiusKm, setRadiusKm] = useState(5);
  const { toast } = useToast();

  const fetchHeatmaps = useCallback(async () => {
    try {
      const r = await fetch("/api/heatmap");
      if (!r.ok) throw new Error();
      const data = await r.json();
      setHeatmaps(data.heatmaps || []);
    } catch {
      toast("Failed to load heatmaps", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchHeatmaps();
  }, [fetchHeatmaps]);

  const loadHeatmap = async (id: string) => {
    try {
      const r = await fetch(`/api/heatmap/${id}`);
      if (!r.ok) throw new Error();
      const data = await r.json();
      setActiveHeatmap(data.heatmap);
      setSelectedPoint(null);
    } catch {
      toast("Failed to load heatmap", "error");
    }
  };

  const runHeatmap = async () => {
    if (!keyword.trim()) {
      toast("Enter a keyword to search", "error");
      return;
    }

    setRunning(true);
    try {
      const r = await fetch("/api/heatmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), gridSize, radiusKm }),
      });

      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Failed to run heatmap");
      }

      const data = await r.json();
      setActiveHeatmap(data.heatmap);
      setSelectedPoint(null);
      toast(`Heatmap complete! Visibility: ${data.heatmap.visibility}%`);
      fetchHeatmaps(); // Refresh the list
    } catch (e: any) {
      toast(e.message || "Failed to run heatmap scan", "error");
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav />
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-skeleton mb-2" />
          <div className="h-4 w-72 bg-gray-200 rounded animate-skeleton mb-8" />
          <div className="bg-gray-200 rounded-2xl h-96 animate-skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Local Rank Heatmap</h1>
          <p className="text-gray-500 text-sm">
            See where you rank in Google Maps across a geographic grid around your business
          </p>
        </div>

        {/* Search form */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Search keyword</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder='e.g. "italian restaurant" or "dentist near me"'
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === "Enter" && !running && runHeatmap()}
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-gray-500 mb-1">Grid size</label>
              <select
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={3}>3×3</option>
                <option value={5}>5×5</option>
                <option value={7}>7×7</option>
                <option value={9}>9×9</option>
              </select>
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-gray-500 mb-1">Radius (km)</label>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={2}>2 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={15}>15 km</option>
                <option value={20}>20 km</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={runHeatmap}
                disabled={running || !keyword.trim()}
                className="bg-blue-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {running && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {running ? "Scanning..." : "Run Scan"}
              </button>
            </div>
          </div>
          {running && (
            <div className="mt-3 bg-blue-50 text-blue-700 text-xs rounded-lg px-3 py-2">
              Querying Google Places at {gridSize * gridSize} grid points... This may take 15–30 seconds.
            </div>
          )}
        </div>

        {/* Active heatmap visualization */}
        {activeHeatmap && (
          <div className="space-y-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">
                  &ldquo;{activeHeatmap.keyword}&rdquo;
                </h2>
                <div className="text-xs text-gray-500">
                  {activeHeatmap.gridSize}×{activeHeatmap.gridSize} grid · {activeHeatmap.radiusKm}km radius ·{" "}
                  {new Date(activeHeatmap.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>

            <StatsBar heatmap={activeHeatmap} />

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <HeatmapGrid
                  heatmap={activeHeatmap}
                  selectedPoint={selectedPoint}
                  onSelectPoint={setSelectedPoint}
                />
                <div className="mt-4">
                  <Legend />
                </div>
              </div>
              <div>
                {selectedPoint ? (
                  <PointDetail point={selectedPoint} />
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                    <div className="text-gray-400 text-sm">
                      Click a grid cell to see details
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Previous scans */}
        {heatmaps.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">Previous Scans</h2>
            <div className="space-y-2">
              {heatmaps.map((h) => (
                <button
                  key={h.id}
                  onClick={() => loadHeatmap(h.id)}
                  className={`w-full text-left bg-white rounded-xl border p-4 transition hover:border-blue-300 hover:shadow-sm ${
                    activeHeatmap?.id === h.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">&ldquo;{h.keyword}&rdquo;</div>
                      <div className="text-xs text-gray-500">
                        {h.gridSize}×{h.gridSize} · {h.radiusKm}km ·{" "}
                        {new Date(h.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {h.visibility !== null && (
                        <span className={`text-sm font-bold ${
                          h.visibility >= 70 ? "text-green-600" :
                          h.visibility >= 40 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {h.visibility}%
                        </span>
                      )}
                      {h.bestRank && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                          Best: #{h.bestRank}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        h.status === "COMPLETED" ? "bg-green-50 text-green-600" :
                        h.status === "RUNNING" ? "bg-blue-50 text-blue-600" :
                        h.status === "FAILED" ? "bg-red-50 text-red-600" :
                        "bg-gray-50 text-gray-500"
                      }`}>
                        {h.status.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!activeHeatmap && heatmaps.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">🗺️</div>
            <h3 className="font-semibold text-lg mb-2">No heatmap scans yet</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
              Enter a keyword above to see where you rank across a geographic grid around your
              business. Each cell shows your Google Maps position at that location.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HeatmapPage() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <HeatmapContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}
