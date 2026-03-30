"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import AppNav from "@/components/AppNav";
import MapGrid, { MapPoint, MapLegend, rankToColor } from "@/components/MapGrid";
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

// Convert HeatmapPoints to MapPoints
function toMapPoints(points: HeatmapPoint[]): MapPoint[] {
  return points.map((p) => ({
    id: p.id,
    lat: p.latitude,
    lng: p.longitude,
    rank: p.rank,
    gridRow: p.gridRow,
    gridCol: p.gridCol,
    topCompetitor: p.topCompetitor,
    totalResults: p.totalResults,
  }));
}

// ─── SoLV calculation ───────────────────────────────────────

function calcSoLV(points: HeatmapPoint[]): number {
  if (points.length === 0) return 0;
  const top3 = points.filter((p) => p.rank !== null && p.rank <= 3).length;
  return Math.round((top3 / points.length) * 100);
}

// ─── Keyword Card ───────────────────────────────────────────

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
  const solv = heatmap.points ? calcSoLV(heatmap.points) : 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        isActive
          ? "border-blue-500 bg-blue-500/10"
          : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm text-white truncate">{heatmap.keyword}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {heatmap.gridSize}&times;{heatmap.gridSize} &middot; {heatmap.radiusKm}km
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3">
          {heatmap.bestRank && (
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
              Best #{heatmap.bestRank}
            </span>
          )}
          <div
            className={`text-lg font-bold ${
              vis >= 70 ? "text-emerald-400" : vis >= 40 ? "text-amber-400" : "text-red-400"
            }`}
          >
            {vis}%
          </div>
        </div>
      </div>
      {/* Mini visibility bar */}
      <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            vis >= 70 ? "bg-emerald-500" : vis >= 40 ? "bg-amber-500" : "bg-red-500"
          }`}
          style={{ width: `${vis}%` }}
        />
      </div>
    </button>
  );
}

// ─── Point Detail Panel ─────────────────────────────────────

function PointDetail({ point }: { point: HeatmapPoint }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow"
          style={{ backgroundColor: rankToColor(point.rank) }}
        >
          {point.rank ?? "—"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium">
            {point.rank ? `Ranking #${point.rank}` : "Not found in top 20"}
          </div>
          <div className="text-slate-500 text-xs">
            {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)} &middot;{" "}
            {point.totalResults ?? 0} results
          </div>
        </div>
      </div>
      {point.topCompetitor && (
        <div className="mt-3 text-xs text-slate-400 border-t border-slate-800 pt-3">
          <span className="text-slate-500">Top competitor:</span>{" "}
          <span className="text-white font-medium">{point.topCompetitor}</span>
        </div>
      )}
    </div>
  );
}

// ─── Aggregate Overview ─────────────────────────────────────

function AggregateOverview({ heatmaps }: { heatmaps: HeatmapSearch[] }) {
  const completed = heatmaps.filter((h) => h.status === "COMPLETED" && h.visibility !== null);
  if (completed.length === 0) return null;

  const avgVisibility = Math.round(
    completed.reduce((sum, h) => sum + (h.visibility ?? 0), 0) / completed.length
  );
  const bestRank = Math.min(
    ...completed.filter((h) => h.bestRank !== null).map((h) => h.bestRank!)
  );
  const avgRank =
    Math.round(
      (completed.filter((h) => h.avgRank !== null).reduce((sum, h) => sum + h.avgRank!, 0) /
        completed.filter((h) => h.avgRank !== null).length) *
        10
    ) / 10;
  const allPoints = completed.flatMap((h) => h.points || []);
  const solv = calcSoLV(allPoints);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="text-xs text-slate-500 mb-1">Share of Local Voice</div>
        <div className={`text-2xl font-bold ${solv >= 50 ? "text-emerald-400" : solv >= 25 ? "text-amber-400" : "text-red-400"}`}>
          {solv}%
        </div>
        <div className="text-xs text-slate-600">top 3 across all points</div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="text-xs text-slate-500 mb-1">Avg Visibility</div>
        <div className={`text-2xl font-bold ${avgVisibility >= 70 ? "text-emerald-400" : avgVisibility >= 40 ? "text-amber-400" : "text-red-400"}`}>
          {avgVisibility}%
        </div>
        <div className="text-xs text-slate-600">found in top 20</div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="text-xs text-slate-500 mb-1">Best Rank</div>
        <div className="text-2xl font-bold text-emerald-400">
          {isFinite(bestRank) ? `#${bestRank}` : "—"}
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="text-xs text-slate-500 mb-1">Avg Rank</div>
        <div className="text-2xl font-bold text-blue-400">{avgRank ? `#${avgRank}` : "—"}</div>
      </div>
    </div>
  );
}

// ─── Scanning Progress ──────────────────────────────────────

function ScanProgress({ total, scanned }: { total: number; scanned: number }) {
  const pct = Math.round((scanned / total) * 100);
  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <h3 className="font-semibold text-blue-300">Scanning your area...</h3>
      </div>
      <p className="text-blue-400/70 text-sm mb-3">
        Querying Google Maps for each keyword across your geographic grid.
      </p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-blue-500/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm font-medium text-blue-300 whitespace-nowrap">
          {scanned} / {total}
        </span>
      </div>
    </div>
  );
}

// ─── Main Content ───────────────────────────────────────────

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

  const runAutoScan = useCallback(async () => {
    if (autoScanTriggered.current) return;
    autoScanTriggered.current = true;
    try {
      const checkRes = await fetch("/api/heatmap/auto");
      if (!checkRes.ok) return;
      const checkData = await checkRes.json();
      setCategory(checkData.category);
      if (!checkData.business) return;
      if (checkData.needsScan.length === 0 && checkData.alreadyScanned.length > 0) return;

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
        const maps = await fetchHeatmaps();
        if (maps.length > 0) loadHeatmap(maps[0].id);
      }
    } catch (err) {
      console.error("Auto-scan error:", err);
      setScanning(false);
    }
  }, [fetchHeatmaps, toast]);

  useEffect(() => {
    (async () => {
      const maps = await fetchHeatmaps();
      if (maps.length > 0) {
        loadHeatmap(maps[0].id);
      } else {
        runAutoScan();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Find selected HeatmapPoint when MapGrid reports a selection
  const handleMapSelect = (mp: MapPoint) => {
    if (!activeHeatmap) return;
    const found = activeHeatmap.points.find((p) => p.id === mp.id);
    setSelectedPoint(found || null);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AppNav />
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="h-8 w-64 bg-slate-800 rounded animate-skeleton mb-2" />
          <div className="h-4 w-96 bg-slate-800 rounded animate-skeleton mb-8" />
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-800 rounded-xl animate-skeleton" />
              ))}
            </div>
            <div className="lg:col-span-8">
              <div className="h-[500px] bg-slate-800 rounded-2xl animate-skeleton" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AppNav />

      <div className="mx-auto max-w-7xl px-6 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Local Rank Grid</h1>
            <p className="text-slate-500 text-sm">
              {category
                ? `Tracking visibility for "${category}" keywords across Google Maps`
                : "See where you rank in Google Maps across your area"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddKeyword(!showAddKeyword)}
              className="text-sm px-3 py-1.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
            >
              + Keyword
            </button>
            <button
              onClick={rescanAll}
              disabled={scanning}
              className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {scanning && (
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {scanning ? "Scanning..." : "Rescan all"}
            </button>
          </div>
        </div>

        {/* Custom keyword input */}
        {showAddKeyword && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex gap-3">
            <input
              type="text"
              value={customKeyword}
              onChange={(e) => setCustomKeyword(e.target.value)}
              placeholder="Enter a keyword to track..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        {!scanning && heatmaps.length > 0 && <AggregateOverview heatmaps={heatmaps} />}

        {/* Main content: keyword sidebar + map */}
        {heatmaps.length > 0 && (
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left: keyword cards */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-2">
              <h2 className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-3">
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

            {/* Right: map + details */}
            <div className="lg:col-span-8 xl:col-span-9">
              {activeHeatmap ? (
                <div className="space-y-4">
                  {/* Keyword header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-lg text-white">
                        &ldquo;{activeHeatmap.keyword}&rdquo;
                      </h2>
                      <div className="text-xs text-slate-500">
                        {activeHeatmap.gridSize}&times;{activeHeatmap.gridSize} grid &middot;{" "}
                        {activeHeatmap.radiusKm}km radius &middot;{" "}
                        {new Date(activeHeatmap.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-emerald-400 font-bold text-lg">
                          {calcSoLV(activeHeatmap.points)}%
                        </div>
                        <div className="text-slate-500 text-xs">SoLV</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-lg">
                          {activeHeatmap.bestRank ? `#${activeHeatmap.bestRank}` : "—"}
                        </div>
                        <div className="text-slate-500 text-xs">best</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-lg">
                          {activeHeatmap.avgRank ? `#${activeHeatmap.avgRank}` : "—"}
                        </div>
                        <div className="text-slate-500 text-xs">avg</div>
                      </div>
                    </div>
                  </div>

                  {/* The Map — this is the product */}
                  <MapGrid
                    points={toMapPoints(activeHeatmap.points)}
                    centerLat={activeHeatmap.centerLat}
                    centerLng={activeHeatmap.centerLng}
                    radiusKm={activeHeatmap.radiusKm}
                    selectedPointId={selectedPoint?.id}
                    onSelectPoint={handleMapSelect}
                    height="520px"
                    interactive
                    showBusinessPin
                  />

                  <MapLegend />

                  {/* Selected point detail */}
                  {selectedPoint && <PointDetail point={selectedPoint} />}
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                  <div className="text-slate-500 text-sm">Select a keyword to view its rank grid</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!scanning && heatmaps.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Connect your business to get started</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              Once your Google Business Profile is connected, we&apos;ll automatically scan your area
              for the keywords that matter most to your business category.
            </p>
            <a
              href="/connect"
              className="inline-block bg-white text-slate-900 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
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
