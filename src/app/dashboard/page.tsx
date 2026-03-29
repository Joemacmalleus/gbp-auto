"use client";

import { useEffect, useState, useCallback } from "react";
import AppNav from "@/components/AppNav";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider, useToast } from "@/components/Toast";

interface DashboardData {
  business: {
    name: string;
    category: string;
    optimizationScore: number;
    auditJson: any;
    lastAuditAt: string;
  };
  stats: {
    postsThisMonth: number;
    reviewsTotal: number;
    reviewsUnreplied: number;
    averageRating: number;
    avgRanking: number | null;
  };
  activities: Array<{
    id: string;
    type: string;
    title: string;
    detail: string;
    createdAt: string;
  }>;
  upcomingPosts: Array<{
    id: string;
    content: string;
    scheduledFor: string;
    status: string;
  }>;
}

// ─── Skeleton Loader ────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center gap-6">
          <div className="w-8 h-8 bg-slate-700 rounded-lg animate-skeleton" />
          <div className="w-20 h-4 bg-slate-700 rounded animate-skeleton" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-skeleton mb-2" />
        <div className="h-4 w-32 bg-slate-200 rounded animate-skeleton mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-5 h-28 animate-skeleton shadow-sm" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-6 h-72 animate-skeleton shadow-sm" />
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 h-72 animate-skeleton shadow-sm" />
        </div>
      </div>
    </div>
  );
}

// ─── Error State ────────────────────────────────────────────
function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav />
      <div className="mx-auto max-w-7xl px-6 py-20 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Couldn&apos;t load your dashboard</h2>
        <p className="text-slate-500 mb-6">This might be a temporary issue. Try refreshing or check back in a moment.</p>
        <button onClick={onRetry} className="bg-blue-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          Try again
        </button>
      </div>
    </div>
  );
}

// ─── Metric Card Icon ──────────────────────────────────────
function MetricIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    posts: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    reviews: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    rating: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    ranking: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  };
  const colors: Record<string, string> = {
    posts: "text-blue-500 bg-blue-50",
    reviews: "text-amber-500 bg-amber-50",
    rating: "text-rose-500 bg-rose-50",
    ranking: "text-emerald-500 bg-emerald-50",
  };
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[type] || "text-slate-500 bg-slate-50"}`}>
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icons[type] || ""} />
      </svg>
    </div>
  );
}

// ─── Activity icon ─────────────────────────────────────────
function ActivityDot({ type }: { type: string }) {
  const color =
    type === "RANKING_CHECKED" ? "bg-emerald-500" :
    type === "POST_PUBLISHED" ? "bg-blue-500" :
    type === "REVIEW_REPLIED" ? "bg-amber-500" :
    type === "AUDIT_RUN" ? "bg-purple-500" : "bg-slate-400";
  return <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${color}`} />;
}

// ─── Dashboard Content ──────────────────────────────────────
function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "audit">("overview");
  const [rerunning, setRerunning] = useState(false);
  const { toast } = useToast();

  const fetchDashboard = useCallback(() => {
    setError(false);
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const rerunAudit = async () => {
    setRerunning(true);
    try {
      const res = await fetch("/api/optimize", { method: "POST" });
      if (!res.ok) throw new Error();
      toast("Audit complete — refreshing data");
      fetchDashboard();
    } catch {
      toast("Failed to re-run audit. Please try again.", "error");
    } finally {
      setRerunning(false);
    }
  };

  if (error) return <DashboardError onRetry={fetchDashboard} />;
  if (!data) return <DashboardSkeleton />;

  const { business, stats, activities, upcomingPosts } = data;
  const score = business.optimizationScore;
  const scoreColor = score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-500";
  const scoreRingColor = score >= 80 ? "#16a34a" : score >= 50 ? "#d97706" : "#ef4444";

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav businessName={business.name} />

      <div className="mx-auto max-w-7xl px-6 py-8 animate-fade-in">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
            <p className="text-slate-500 text-sm">{business.category}</p>
          </div>
          <button
            onClick={rerunAudit}
            disabled={rerunning}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {rerunning && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {rerunning ? "Running..." : "Re-run audit"}
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 stagger-children">
          {/* Score card — special treatment */}
          <div className="card card-hover p-5 flex items-center gap-4 metric-blue">
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={scoreRingColor} strokeWidth="8" strokeDasharray={`${score * 2.51} 251`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${scoreColor}`}>{score}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Optimization</div>
              <div className="font-semibold text-slate-900">Score</div>
            </div>
          </div>

          {/* Metric cards */}
          {[
            { label: "Posts this month", value: stats.postsThisMonth, type: "posts", accent: "metric-blue" },
            { label: "Reviews", value: `${stats.reviewsTotal} (${stats.reviewsUnreplied} need reply)`, type: "reviews", accent: "metric-amber" },
            { label: "Avg. Rating", value: stats.averageRating?.toFixed(1) ?? "—", type: "rating", accent: "metric-green" },
            { label: "Avg. Ranking", value: stats.avgRanking ? `#${stats.avgRanking}` : "—", type: "ranking", accent: "metric-purple" },
          ].map((s) => (
            <div key={s.label} className={`card card-hover p-5 ${s.accent}`}>
              <MetricIcon type={s.type} />
              <div className="mt-3">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">{s.label}</div>
                <div className="font-semibold text-lg text-slate-900 mt-0.5">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm rounded-md transition-all duration-200 ${
              activeTab === "overview" ? "bg-white font-medium shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 text-sm rounded-md transition-all duration-200 ${
              activeTab === "audit" ? "bg-white font-medium shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Audit breakdown
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Activity feed */}
            <div className="lg:col-span-2 card p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Recent activity</h2>
              {activities.length === 0 ? (
                <div className="empty-state py-12">
                  <div className="empty-state-icon">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-medium text-sm mb-1">No activity yet</p>
                  <p className="text-slate-400 text-xs max-w-xs">Activities will appear here as you run audits, publish posts, and respond to reviews.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((a) => (
                    <div key={a.id} className="flex gap-3 items-start group">
                      <ActivityDot type={a.type} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800">{a.title}</div>
                        {a.detail && <div className="text-sm text-slate-500 mt-0.5 truncate">{a.detail}</div>}
                        <div className="text-xs text-slate-400 mt-1">
                          {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming posts */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">Upcoming posts</h2>
                <a href="/posts" className="text-blue-600 text-sm hover:text-blue-700 transition-colors font-medium">View all</a>
              </div>
              {upcomingPosts.length === 0 ? (
                <div className="empty-state py-8">
                  <div className="empty-state-icon">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-medium text-sm mb-1">No posts scheduled</p>
                  <a href="/posts?generate=true" className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors mt-2 inline-block">
                    Generate posts with AI →
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingPosts.map((p) => (
                    <div key={p.id} className="border border-slate-100 rounded-lg p-3 hover:border-slate-200 transition-colors">
                      <div className="text-sm text-slate-700 line-clamp-2">{p.content}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-400">
                          {new Date(p.scheduledFor).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        <span className={`badge ${
                          p.status === "APPROVED" ? "badge-green" : "badge-amber"
                        }`}>
                          {p.status.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "audit" && business.auditJson && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-slate-900">Optimization audit</h2>
              {business.lastAuditAt && (
                <span className="text-xs text-slate-400">
                  Last run: {new Date(business.lastAuditAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </div>

            {business.auditJson.topPriorities && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5 mb-6 border border-blue-100/60">
                <div className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Top priorities
                </div>
                <ol className="list-decimal list-inside space-y-1.5">
                  {business.auditJson.topPriorities.map((p: string, i: number) => (
                    <li key={i} className="text-sm text-blue-800 leading-relaxed">{p}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="space-y-3">
              {(business.auditJson.sections || []).map(
                (s: { name: string; score: number; maxScore: number; status: string; recommendation: string }) => (
                  <div key={s.name} className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-slate-800">{s.name}</span>
                      <span className={`badge ${
                        s.status === "good" ? "badge-green" :
                        s.status === "needs_work" ? "badge-amber" : "badge-red"
                      }`}>
                        {s.score}/{s.maxScore}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          s.status === "good" ? "bg-emerald-500" : s.status === "needs_work" ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${(s.score / s.maxScore) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{s.recommendation}</p>
                  </div>
                )
              )}
            </div>

            {business.auditJson.estimatedImpact && (
              <div className="mt-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-100/60">
                <div className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Estimated impact
                </div>
                <p className="text-sm text-emerald-800 mt-1.5 leading-relaxed">{business.auditJson.estimatedImpact}</p>
              </div>
            )}
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
