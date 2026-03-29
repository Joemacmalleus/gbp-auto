"use client";

import { useEffect, useState } from "react";

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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "audit">("overview");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { business, stats, activities, upcomingPosts } = data;
  const score = business.optimizationScore;
  const scoreColor = score >= 80 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";
  const scoreRingColor = score >= 80 ? "#16a34a" : score >= 50 ? "#ca8a04" : "#dc2626";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">G</span>
              </div>
              <span className="font-semibold">GBP Auto</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <a href="/dashboard" className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-900 font-medium">
                Dashboard
              </a>
              <a href="/posts" className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-50">
                Posts
              </a>
              <a href="/reviews" className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-50">
                Reviews
              </a>
            </div>
          </div>
          <div className="text-sm text-gray-500">{business.name}</div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{business.name}</h1>
            <p className="text-gray-500">{business.category}</p>
          </div>
          <button
            onClick={() => fetch("/api/optimize", { method: "POST" }).then(() => window.location.reload())}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Re-run audit
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Optimization score — larger card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={scoreRingColor}
                  strokeWidth="8"
                  strokeDasharray={`${score * 2.51} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${scoreColor}`}>{score}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Optimization</div>
              <div className="font-semibold">Score</div>
            </div>
          </div>

          {[
            { label: "Posts this month", value: stats.postsThisMonth, icon: "📝" },
            {
              label: "Reviews",
              value: `${stats.reviewsTotal} (${stats.reviewsUnreplied} need reply)`,
              icon: "⭐",
            },
            { label: "Avg. Rating", value: stats.averageRating.toFixed(1), icon: "💛" },
            {
              label: "Avg. Ranking",
              value: stats.avgRanking ? `#${stats.avgRanking}` : "—",
              icon: "📈",
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
              <div className="font-semibold text-lg">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm rounded-lg transition ${
              activeTab === "overview"
                ? "bg-white border border-gray-200 font-medium shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 text-sm rounded-lg transition ${
              activeTab === "audit"
                ? "bg-white border border-gray-200 font-medium shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Audit breakdown
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Activity feed */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold mb-4">Recent activity</h2>
              {activities.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No activity yet</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((a) => (
                    <div key={a.id} className="flex gap-3 items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{a.title}</div>
                        {a.detail && (
                          <div className="text-sm text-gray-500 mt-0.5">{a.detail}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(a.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming posts sidebar */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Upcoming posts</h2>
                <a href="/posts" className="text-blue-600 text-sm hover:underline">
                  View all
                </a>
              </div>
              {upcomingPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-3">No posts scheduled</p>
                  <a
                    href="/posts?generate=true"
                    className="text-blue-600 text-sm font-medium hover:underline"
                  >
                    Generate posts with AI
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingPosts.map((p) => (
                    <div key={p.id} className="border border-gray-100 rounded-lg p-3">
                      <div className="text-sm text-gray-700 line-clamp-2">{p.content}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(p.scheduledFor).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            p.status === "APPROVED"
                              ? "bg-green-50 text-green-700"
                              : "bg-yellow-50 text-yellow-700"
                          }`}
                        >
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
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold">Optimization audit</h2>
              {business.lastAuditAt && (
                <span className="text-xs text-gray-400">
                  Last run:{" "}
                  {new Date(business.lastAuditAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>

            {/* Top priorities */}
            {business.auditJson.topPriorities && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="text-sm font-medium text-blue-900 mb-2">Top priorities</div>
                <ol className="list-decimal list-inside space-y-1">
                  {business.auditJson.topPriorities.map((p: string, i: number) => (
                    <li key={i} className="text-sm text-blue-800">
                      {p}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Section scores */}
            <div className="space-y-3">
              {(business.auditJson.sections || []).map(
                (s: { name: string; score: number; maxScore: number; status: string; recommendation: string }) => (
                  <div key={s.name} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{s.name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          s.status === "good"
                            ? "bg-green-50 text-green-700"
                            : s.status === "needs_work"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {s.score}/{s.maxScore}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                      <div
                        className={`h-1.5 rounded-full ${
                          s.status === "good"
                            ? "bg-green-500"
                            : s.status === "needs_work"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${(s.score / s.maxScore) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">{s.recommendation}</p>
                  </div>
                )
              )}
            </div>

            {business.auditJson.estimatedImpact && (
              <div className="mt-6 bg-green-50 rounded-lg p-4">
                <div className="text-sm font-medium text-green-900">Estimated impact</div>
                <p className="text-sm text-green-800 mt-1">{business.auditJson.estimatedImpact}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
