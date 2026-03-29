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

function rankLabel(rank: number | null): string {
  if (rank === null) return "\u2014";
  return `#${rank}`;
}

// ─── Grid Cell ─────────────────────────────────────────────

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
      {point.rank ?? "\u2014"}
    </button>
  );
}

// ─── Grid Visualization ─────────────────────────────────────

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
      <div className="text-center mt-3">
        <span className="text-xs text-gray-400">
          Your business is at the center &middot; {heatmap.radiusKm}km radius
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
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs text-gray-500 mb-1">Best Rank</div>
        <div className="text-2xl font-bold text-green-600">
          {heatmap.bestRank ? `#${heatmap.bestRank}` : "\u2014"}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs text-gray-500 mb-1">Avg Rank</div>
        <div className="text-2xl font-bold text-blue-600">
          {heatmap.avgRank ? `#${heatmap.avgRank}` : "\u2014"}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs text-gray-500 mb-1">Worst Rank</div>
        <div className="text-2xl font-bold text-orange-600">
          {heatmap.worstRank ? `#${heatmap.worstRank}` : "\u2014"}
        </div>
      </div>
    </div>
  );
}

// ─── Point Detail ───────────────────────────────────────────

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
          <div>{point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}</div>
          <div>{point.totalResults ?? 0} results at this location</div>
          {point.topCompetitor && (
            <div>Top competitor: {point.topCompetitor}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────

function Legend() {
  const items = [
    { label: "#1\u20133", color: "#22C55E" },
    { label: "#4\u20135", color: "#84CC16" },
    { label: "#6\u20137", color: "#EAB308" },
    { label: "#8\u201310", color: "#F97316" },
    { label: "#11\u201315", color: "#EF4444" },
    { label: "#16\u201320", color: "#991B1B" },
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

// ─── Aggregate Overview Card ────────────────────────────────

function AggregateOverview({ heatmaps }: { heatmaps: HeatmapSearch[] }) {
  const completed = heatmaps.filter((h) => h.status === "COMPLETED" && h.visibility !== null);
  if (completed.length === 0) return null;

  const avgVisibility = Math.round(
    completed.reduce((sum, h) => sum + (h.visibility ?? 0), 0) / completed.length
  );
  const bestRank = Math.min(
    ...completed.filter((h) => h.bestRank !== null).map((h) => h.bestRank!)
  );
  const avgRank = Math.round(
    completed.filter((h) => h.avgRank !== null).reduce((sum, h) => sum + h.avgRank!, 0) /
      completed.filter((h) => h.avgRank !== null).length * 10
  ) / 10;
  const keywordsFound = completed.filter((h) => (h.visibility ?? 0) > 0).length;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">Overall Map Visibility</h2>
          <p className="text-blue-200 text-sm">
            Across {completed.length} keyword{completed.length > 1 ? "s" : ""} in your category
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black">{avgVisibility}%</div>
          <div className="text-blue-200 text-xs">avg visibility</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-white/10 rounded-xl p-3">
          <div className="text-2xl font-bold">{isFinite(bestRank) ? `#${bestRank}` : "\u2014"}</div>
          <div className="text-blue-200 text-xs">best rank</div>
        </div>
        <div className="bg-white/10 rounded-xl p-3">
          <div className="text-2xl font-bold">{avgRank ? `#${avgRank}` : "\u2014"}</div>
          <div className="text-blue-200 text-xs">avg rank</div>
        </div>
        <div className="bg-white/10 rounded-xl p-3">
          <div className="text-2xl font-bold">{keywordsFound}/{completed.length}</div>
          <div className="text-blue-200 text-xs">keywords found</div>
        </div>
      </div>
    </div>
  );
}

// ─── Keyword Card (clickable) ───────────────────────────────

function KeywordCard({
  heatmap,
  isActive,
  onClick,
}: {
  heatmap: HeatmapSearch;
  isActive: boolean;
  onClick: () => void;
}) {
  const vis = heatmap.visibility ?? 0;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition hover:shadow-sm ${
        isActive ? "border-blue-500 bg-blue-50 shadow-sm" : "bg-white border-gray-200 hover:border-blue-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{heatmap.keyword}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {heatmap.gridSize}&times;{heatmap.gridSize} &middot; {heatmap.radiusKm}km
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3">
          {heatmap.bestRank && (
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
              Best #{heatmap.bestRank}
            </span>
          )}
          <div className={`text-lg font-bold ${
            vis >= 70 ? "text-green-600" :
            vis >= 40 ? "text-yellow-600" : "text-red-600"
          }`}>
            {vis}%
          </div>
        </div>
      </div>

      {/* Mini visibility bar */}
      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            vis >= 70 ? "bg-green-500" : vis >= 40 ? "bg-yellow-500" : "bg-red-500"
          }`}
          style={{ width: `${vis}%` }}
        />
      </div>
    </button>
  );
}

// ─── Scanning Progress ──────────────────────────────────────

function ScanProgress({ total, scanned }: { total: number; scanned: number }) {
  const pct = Math.round((scanned / total) * 100);
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <h3 className="font-semibold text-blue-900">
          Scanning your area...
        </h3>
      </div>
      <p className="text-blue-700 text-sm mb-3">
        Querying Google Maps for each keyword across your geographic grid. This runs automatically based on your business category.
      </p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-blue-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm font-medium text-blue-800 whitespace-nowrap">
          {scanned} / {total} keywords
        </span>
      </div>
    </div>
  );
}

// ─── Main Page Content ──────────────────────────────────────

function HeatmapContent() {
  const [heatmaps, setHeatmaps] = useState<HeatmapSearch[]>([]);
  const [activeHeatmap, setActiveHeatmap] = useState<HeatmapSearch | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<HeatmapPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ total: 0, scanned: 0 });
  const [category, setCategory] = useState<string | null>(null);
  const [customKeyword, setCustomKeyword] = useState("");
  const [runningCustom, setRunningCustom] = useState(false);
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const { toast } = useToast();
  const autoScanTriggered = useRef(false);

  // Load existing heatmaps
  const fetchHeatmaps = useCallback(async () => {
    try {
      const r = await fetch("/api/heatmap");
      if (!r.ok) throw new Error();
      const data = await r.json();
      const maps = data.heatmaps || [];
      setHeatmaps(maps);
      return maps;
    } catch {
      toast("Failed to load heatmaps", "error");
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load a specific heatmap with full points
  const loadHeatmap = async (id: string) => {
    try {
      const r = await fetch(`/api/heatmap/${id}`);
      if (!r.ok) throw new Error();
      const data = await r.json();
      setActiveHeatmap(data.heatmap);
      setSelectedPoint(null);
    } catch {
      toast("Failed to load heatmap details", "error");
    }
  };

  // Auto-scan: check if we need to run, then run
  const runAutoScan = useCallback(async () => {
    if (autoScanTriggered.current) return;
    autoScanTriggered.current = true;

    try {
      // Check what keywords exist and what needs scanning
      const checkRes = await fetch("/api/heatmap/auto");
      if (!checkRes.ok) return;
      const checkData = await checkRes.json();

      setCategory(checkData.category);

      if (!checkData.business) return;

      // If all keywords already scanned recently, just load them
      if (checkData.needsScan.length === 0 && checkData.alreadyScanned.length > 0) {
        return;
      }

      // If there are keywords to scan, run the auto-scan
      if (checkData.needsScan.length > 0) {
        setScanning(true);
        setScanProgress({ total: checkData.needsScan.length, scanned: 0 });

        const res = await fetch("/api/heatmap/auto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gridSize: 5, radiusKm: 5 }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.heatmaps?.length > 0) {
            setScanProgress({ total: data.heatmaps.length, scanned: data.heatmaps.length });
            toast(`Scanned ${data.heatmaps.length} keywords for your area`);
          }
        }

        setScanning(false);
        // Refresh the heatmap list
        const maps = await fetchHeatmaps();
        // Auto-select the first one
        if (maps.length > 0) {
          loadHeatmap(maps[0].id);
        }
      }
    } catch (err) {
      console.error("Auto-scan error:", err);
      setScanning(false);
    }
  }, [fetchHeatmaps, toast]);

  // Initial load
  useEffect(() => {
    (async () => {
      const maps = await fetchHeatmaps();
      if (maps.length > 0) {
        // Auto-load the first heatmap
        loadHeatmap(maps[0].id);
      } else {
        // No existing scans — trigger auto-scan
        runAutoScan();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run a custom keyword scan
  const runCustomScan = async () => {
    if (!customKeyword.trim()) return;
    setRunningCustom(true);
    try {
      const r = await fetch("/api/heatmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: customKeyword.trim(), gridSize: 5, radiusKm: 5 }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Failed to run scan");
      }
      const data = await r.json();
      setActiveHeatmap(data.heatmap);
      setSelectedPoint(null);
      setCustomKeyword("");
      setShowAddKeyword(false);
      toast(`Scan complete: ${data.heatmap.visibility}% visibility`);
      fetchHeatmaps();
    } catch (e: any) {
      toast(e.message || "Scan failed", "error");
    } finally {
      setRunningCustom(false);
    }
  };

  // Re-scan all keywords
  const rescanAll = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/heatmap/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gridSize: 5, radiusKm: 5, force: true }),
      });
      if (res.ok) {
        const data = await res.json();
        toast(`Re-scanned ${data.scanned} keywords`);
        const maps = await fetchHeatmaps();
        if (maps.length > 0) loadHeatmap(maps[0].id);
      }
    } catch {
      toast("Re-scan failed", "error");
    } finally {
      setScanning(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav />
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="h-8 w-64 bg-gray-200 rounded animate-skeleton mb-2" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-skeleton mb-8" />
          <div className="bg-gray-200 rounded-2xl h-40 animate-skeleton mb-6" />
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-200 rounded-xl h-24 animate-skeleton" />
            <div className="bg-gray-200 rounded-xl h-24 animate-skeleton" />
            <div className="bg-gray-200 rounded-xl h-24 animate-skeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Local Rank Heatmap</h1>
            <p className="text-gray-500 text-sm">
              {category
                ? `Auto-tracking your visibility for "${category}" keywords across Google Maps`
                : "See where you rank in Google Maps across your area"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddKeyword(!showAddKeyword)}
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              + Add keyword
            </button>
            <button
              onClick={rescanAll}
              disabled={scanning}
              className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {scanning && (
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {scanning ? "Scanning..." : "Rescan all"}
            </button>
          </div>
        </div>

        {/* Custom keyword input (expandable) */}
        {showAddKeyword && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex gap-3">
            <input
              type="text"
              value={customKeyword}
              onChange={(e) => setCustomKeyword(e.target.value)}
              placeholder="Enter a custom keyword to track..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && !runningCustom && runCustomScan()}
              autoFocus
            />
            <button
              onClick={runCustomScan}
              disabled={runningCustom || !customKeyword.trim()}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {runningCustom && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {runningCustom ? "Scanning..." : "Scan"}
            </button>
          </div>
        )}

        {/* Scanning progress */}
        {scanning && scanProgress.total > 0 && (
          <ScanProgress total={scanProgress.total} scanned={scanProgress.scanned} />
        )}

        {/* Aggregate overview */}
        {!scanning && heatmaps.length > 0 && (
          <AggregateOverview heatmaps={heatmaps} />
        )}

        {/* Keyword list + Grid */}
        {heatmaps.length > 0 && (
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left: keyword cards */}
            <div className="lg:col-span-4 space-y-2">
              <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-2">
                Tracked Keywords
              </h2>
              {heatmaps
                .filter((h) => h.status === "COMPLETED")
                .map((h) => (
                  <KeywordCard
                    key={h.id}
                    heatmap={h}
                    isActive={activeHeatmap?.id === h.id}
                    onClick={() => loadHeatmap(h.id)}
                  />
                ))}
            </div>

            {/* Right: active heatmap grid */}
            <div className="lg:col-span-8">
              {activeHeatmap ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-semibold text-lg">
                      &ldquo;{activeHeatmap.keyword}&rdquo;
                    </h2>
                    <div className="text-xs text-gray-500">
                      {activeHeatmap.gridSize}&times;{activeHeatmap.gridSize} grid &middot; {activeHeatmap.radiusKm}km radius &middot;{" "}
                      {new Date(activeHeatmap.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <StatsBar heatmap={activeHeatmap} />

                  <HeatmapGrid
                    heatmap={activeHeatmap}
                    selectedPoint={selectedPoint}
                    onSelectPoint={setSelectedPoint}
                  />

                  <Legend />

                  {selectedPoint && <PointDetail point={selectedPoint} />}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="text-gray-400 text-sm">
                    Select a keyword to view its heatmap
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state — no business connected */}
        {!scanning && heatmaps.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">&#x1F5FA;&#xFE0F;</div>
            <h3 className="font-semibold text-lg mb-2">Connect your business to get started</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              Once your Google Business Profile is connected, we will automatically scan your area for the keywords that matter most to your business category.
            </p>
            <a
              href="/connect"
              className="inline-block bg-blue-600 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-blue-700 transition"
            >
              Connect your GBP
            </a>
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
