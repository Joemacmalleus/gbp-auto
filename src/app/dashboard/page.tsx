"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

interface DashboardData {
  business: {
    name: string;
    category: string;
    optimizationScore: number;
  };
  stats: {
    postsThisMonth: number;
    reviewsTotal: number;
    reviewsUnreplied: number;
    averageRating: number;
    avgRanking: number | null;
  };
}

// ─── Color helpers ──────────────────────────────────────────

function rankToColor(rank: number | null): string {
  if (rank === null) return "#374151";
  if (rank <= 3) return "#22C55E";
  if (rank <= 5) return "#84CC16";
  if (rank <= 7) return "#EAB308";
  if (rank <= 10) return "#F97316";
  if (rank <= 15) return "#EF4444";
  return "#991B1B";
}

// ─── Grid Cell ─────────────────────────────────────────────

function GridCell({
  point,
  selected,
  onClick,
  index,
}: {
  point: HeatmapPoint;
  selected: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        heatmap-cell aspect-square rounded-lg flex items-center justify-center
        text-white font-bold text-sm transition-all cursor-pointer
        hover:scale-110 hover:z-10 hover:shadow-lg
        ${selected ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 z-10" : ""}
      `}
      style={{
        backgroundColor: rankToColor(point.rank),
        animationDelay: `${index * 0.03}s`,
      }}
      title={point.rank ? `#${point.rank}` : "Not found"}
    >
      {point.rank ?? "—"}
    </button>
  );
}

// ─── Heatmap Grid ──────────────────────────────────────────

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
  const grid: (HeatmapPoint | null)[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(null)
  );
  heatmap.points.forEach((p) => {
    if (p.gridRow < gridSize && p.gridCol < gridSize) {
      grid[p.gridRow][p.gridCol] = p;
    }
  });

  return (
    <div
      className="grid gap-1.5 mx-auto"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
        maxWidth: `${gridSize * 64}px`,
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
              index={r * gridSize + c}
            />
          ) : (
            <div
              key={`${r}-${c}`}
              className="heatmap-cell aspect-square rounded-lg bg-slate-800 flex items-center justify-center text-slate-600 text-xs"
              style={{ animationDelay: `${(r * gridSize + c) * 0.03}s` }}
            >
              ?
            </div>
          )
        )
      )}
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
    { label: "#16+", color: "#991B1B" },
    { label: "N/A", color: "#374151" },
  ];
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
          <span className="text-xs text-slate-400">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 sticky top-0 z-30">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center gap-6">
          <div className="w-8 h-8 bg-slate-800 rounded-lg animate-skeleton" />
          <div className="w-20 h-4 bg-slate-800 rounded animate-skeleton" />
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="h-6 w-48 bg-slate-800 rounded animate-skeleton mb-8 mx-auto" />
        <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto mb-8">
          {[...Array(25)].map((_, i) => (
            <div key={i} className="aspect-square bg-slate-800 rounded-lg animate-skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-skeleton" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Content ──────────────────────────────────────────

function DashboardContent() {
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [heatmaps, setHeatmaps] = useState<HeatmapSearch[]>([]);
  const [activeHeatmap, setActiveHeatmap] = useState<HeatmapSearch | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<HeatmapPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeKeywordIdx, setActiveKeywordIdx] = useState(0);
  const { toast } = useToast();
  const autoScanTriggered = useRef(false);

  // Fetch dashboard data (business info + stats)
  const fetchDashboard = useCallback(async () => {
    try {
      const r = await fetch("/api/dashboard");
      if (!r.ok) throw new Error();
      const data = await r.json();
      setDashData(data);
    } catch {
      // Not critical — we still show heatmap
    }
  }, []);

  // Fetch heatmaps
  const fetchHeatmaps = useCallback(async () => {
    try {
      const r = await fetch("/api/heatmap");
      if (!r.ok) throw new Error();
      const data = await r.json();
      const maps = data.heatmaps || [];
      setHeatmaps(maps);
      return maps;
    } catch {
      return [];
    }
  }, []);

  // Load a specific heatmap
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

  // Auto-scan
  const runAutoScan = useCallback(async () => {
    if (autoScanTriggered.current) return;
    autoScanTriggered.current = true;
    try {
      const checkRes = await fetch("/api/heatmap/auto");
      if (!checkRes.ok) return;
      const checkData = await checkRes.json();
      if (!checkData.business) return;
      if (checkData.needsScan.length === 0) return;

      setScanning(true);
      const res = await fetch("/api/heatmap/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gridSize: 5, radiusKm: 5 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.heatmaps?.length > 0) {
          toast(`Scanned ${data.heatmaps.length} keywords`);
        }
      }
      setScanning(false);
      const maps = await fetchHeatmaps();
      if (maps.length > 0) loadHeatmap(maps[0].id);
    } catch {
      setScanning(false);
    }
  }, [fetchHeatmaps, toast]);

  // Init
  useEffect(() => {
    (async () => {
      const [maps] = await Promise.all([fetchHeatmaps(), fetchDashboard()]);
      if (maps.length > 0) {
        loadHeatmap(maps[0].id);
      } else {
        runAutoScan();
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch keyword
  const switchKeyword = (idx: number) => {
    setActiveKeywordIdx(idx);
    const completed = heatmaps.filter((h) => h.status === "COMPLETED");
    if (completed[idx]) loadHeatmap(completed[idx].id);
  };

  if (loading) return <DashboardSkeleton />;

  const completedMaps = heatmaps.filter((h) => h.status === "COMPLETED");
  const businessName = dashData?.business?.name;
  const hasHeatmaps = completedMaps.length > 0;

  // Aggregate stats
  const avgVisibility = hasHeatmaps
    ? Math.round(completedMaps.reduce((s, h) => s + (h.visibility ?? 0), 0) / completedMaps.length)
    : 0;
  const bestRank = hasHeatmaps
    ? Math.min(...completedMaps.filter((h) => h.bestRank !== null).map((h) => h.bestRank!))
    : null;
  const avgRank = hasHeatmaps
    ? Math.round(
        completedMaps.filter((h) => h.avgRank !== null).reduce((s, h) => s + h.avgRank!, 0) /
          completedMaps.filter((h) => h.avgRank !== null).length * 10
      ) / 10
    : null;

  return (
    <div className="min-h-screen bg-slate-950">
      <AppNav businessName={businessName} />

      <div className="mx-auto max-w-5xl px-6 py-8 animate-fade-in">

        {/* ── Hero: Heatmap Grid ──────────────────────────────── */}
        {hasHeatmaps && activeHeatmap ? (
          <>
            {/* Keyword selector — compact horizontal pills */}
            {completedMaps.length > 1 && (
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                {completedMaps.map((h, i) => (
                  <button
                    key={h.id}
                    onClick={() => switchKeyword(i)}
                    className={`whitespace-nowrap text-sm px-3 py-1.5 rounded-full transition-all ${
                      activeKeywordIdx === i
                        ? "bg-white text-slate-900 font-medium shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {h.keyword}
                  </button>
                ))}
              </div>
            )}

            {/* Visibility + stats strip */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className={`text-5xl font-black ${
                    avgVisibility >= 70 ? "text-emerald-400" :
                    avgVisibility >= 40 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {avgVisibility}%
                  </span>
                  <span className="text-slate-500 text-sm">map visibility</span>
                </div>
                {businessName && (
                  <p className="text-slate-500 text-sm mt-1">{businessName}</p>
                )}
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-white font-bold text-lg">{isFinite(bestRank ?? Infinity) ? `#${bestRank}` : "—"}</div>
                  <div className="text-slate-500 text-xs">best</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-lg">{avgRank ? `#${avgRank}` : "—"}</div>
                  <div className="text-slate-500 text-xs">average</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-lg">{completedMaps.length}</div>
                  <div className="text-slate-500 text-xs">keywords</div>
                </div>
              </div>
            </div>

            {/* The Grid */}
            <div className="bg-slate-900 rounded-2xl p-6 mb-4">
              <HeatmapGrid
                heatmap={activeHeatmap}
                selectedPoint={selectedPoint}
                onSelectPoint={setSelectedPoint}
              />
              <Legend />
              <div className="text-center mt-3">
                <span className="text-xs text-slate-500">
                  {activeHeatmap.keyword} · {activeHeatmap.gridSize}×{activeHeatmap.gridSize} grid · {activeHeatmap.radiusKm}km radius
                </span>
              </div>
            </div>

            {/* Selected point detail — inline, minimal */}
            {selectedPoint && (
              <div className="bg-slate-900 rounded-xl p-4 mb-6 flex items-center gap-4 animate-fade-in">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: rankToColor(selectedPoint.rank) }}
                >
                  {selectedPoint.rank ?? "—"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">
                    {selectedPoint.rank ? `Ranking #${selectedPoint.rank}` : "Not found in top 20"}
                  </div>
                  <div className="text-slate-500 text-xs">
                    {selectedPoint.latitude.toFixed(4)}, {selectedPoint.longitude.toFixed(4)}
                    {selectedPoint.topCompetitor && ` · Top: ${selectedPoint.topCompetitor}`}
                  </div>
                </div>
              </div>
            )}

            {/* ── Secondary cards ─────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
              {dashData && (
                <>
                  <a href="/heatmap" className="bg-slate-900 rounded-xl p-4 hover:bg-slate-800/80 transition-colors group">
                    <div className="text-xs text-slate-500 mb-1">Full heatmap</div>
                    <div className="text-white font-semibold group-hover:text-blue-400 transition-colors">View details →</div>
                  </a>
                  <a href="/posts" className="bg-slate-900 rounded-xl p-4 hover:bg-slate-800/80 transition-colors">
                    <div className="text-xs text-slate-500 mb-1">Posts this month</div>
                    <div className="text-white font-semibold text-lg">{dashData.stats.postsThisMonth}</div>
                  </a>
                  <a href="/reviews" className="bg-slate-900 rounded-xl p-4 hover:bg-slate-800/80 transition-colors">
                    <div className="text-xs text-slate-500 mb-1">Reviews</div>
                    <div className="text-white font-semibold text-lg">
                      {dashData.stats.reviewsTotal}
                      {dashData.stats.reviewsUnreplied > 0 && (
                        <span className="text-amber-400 text-xs ml-1.5">({dashData.stats.reviewsUnreplied} need reply)</span>
                      )}
                    </div>
                  </a>
                  <div className="bg-slate-900 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Optimization</div>
                    <div className={`font-semibold text-lg ${
                      dashData.business.optimizationScore >= 80 ? "text-emerald-400" :
                      dashData.business.optimizationScore >= 50 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {dashData.business.optimizationScore}/100
                    </div>
                  </div>
                </>
              )}
              {!dashData && (
                <>
                  <a href="/heatmap" className="bg-slate-900 rounded-xl p-4 hover:bg-slate-800/80 transition-colors group">
                    <div className="text-xs text-slate-500 mb-1">Full heatmap</div>
                    <div className="text-white font-semibold group-hover:text-blue-400 transition-colors">View details →</div>
                  </a>
                  <a href="/posts" className="bg-slate-900 rounded-xl p-4 hover:bg-slate-800/80 transition-colors">
                    <div className="text-xs text-slate-500 mb-1">Posts</div>
                    <div className="text-white font-semibold">Manage →</div>
                  </a>
                  <a href="/reviews" className="bg-slate-900 rounded-xl p-4 hover:bg-slate-800/80 transition-colors">
                    <div className="text-xs text-slate-500 mb-1">Reviews</div>
                    <div className="text-white font-semibold">Manage →</div>
                  </a>
                  <div className="bg-slate-900 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Optimization</div>
                    <div className="text-slate-400 font-semibold">—</div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : scanning ? (
          /* Scanning state */
          <div className="text-center py-20">
            <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-white text-lg font-semibold mb-2">Scanning your area</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Checking where you rank across Google Maps for keywords in your category. This takes about a minute.
            </p>
          </div>
        ) : (
          /* Empty state — no business connected */
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">See where you rank</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              Connect your Google Business Profile and we&apos;ll show you exactly where you appear across local search in your area.
            </p>
            <a
              href="/connect"
              className="inline-block bg-white text-slate-900 font-medium text-sm px-6 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Connect your GBP
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <DashboardContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}
