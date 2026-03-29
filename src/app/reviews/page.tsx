"use client";

import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider, useToast } from "@/components/Toast";

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  publishedAt: string;
  aiDraftReply: string | null;
  finalReply: string | null;
  replyStatus: string;
  repliedAt: string | null;
  sentiment: string | null;
  keywords: string[];
}

function ReviewsContent() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "needs_reply" | "replied">("all");
  const [syncing, setSyncing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReply, setEditReply] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const r = await fetch("/api/reviews");
      if (!r.ok) throw new Error();
      const d = await r.json();
      setReviews(d.reviews || []);
    } catch {
      toast("Failed to load reviews", "error");
    } finally {
      setLoading(false);
    }
  };

  const syncReviews = async () => {
    setSyncing(true);
    try {
      const r = await fetch("/api/reviews/sync", { method: "POST" });
      if (!r.ok) throw new Error();
      await fetchReviews();
      toast("Reviews synced from Google");
    } catch {
      toast("Failed to sync reviews", "error");
    } finally {
      setSyncing(false);
    }
  };

  const generateReply = async (id: string) => {
    try {
      const r = await fetch(`/api/reviews/${id}/generate-reply`, { method: "POST" });
      if (!r.ok) throw new Error();
      toast("AI reply generated");
      fetchReviews();
    } catch {
      toast("Failed to generate reply", "error");
    }
  };

  const approveReply = async (id: string, customReply?: string) => {
    try {
      const r = await fetch(`/api/reviews/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: customReply }),
      });
      if (!r.ok) throw new Error();
      setEditingId(null);
      toast("Reply posted to Google!");
      fetchReviews();
    } catch {
      toast("Failed to post reply", "error");
    }
  };

  const skipReply = async (id: string) => {
    try {
      await fetch(`/api/reviews/${id}/skip`, { method: "POST" });
      toast("Review skipped");
      fetchReviews();
    } catch {
      toast("Failed to skip review", "error");
    }
  };

  const filtered = reviews.filter((r) => {
    if (filter === "all") return true;
    if (filter === "needs_reply") return r.replyStatus === "UNREAD" || r.replyStatus === "AI_DRAFTED";
    if (filter === "replied") return r.replyStatus === "PUBLISHED" || r.replyStatus === "APPROVED";
    return true;
  });

  const needsReplyCount = reviews.filter(
    (r) => r.replyStatus === "UNREAD" || r.replyStatus === "AI_DRAFTED"
  ).length;

  const stars = (rating: number) => "★".repeat(rating) + "☆".repeat(5 - rating);

  const sentimentColor = (s: string | null) => {
    if (s === "POSITIVE") return "badge-green";
    if (s === "NEGATIVE") return "badge-red";
    return "badge-slate";
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      UNREAD: { cls: "badge-amber", label: "Needs reply" },
      AI_DRAFTED: { cls: "bg-violet-50 text-violet-700", label: "AI draft ready" },
      APPROVED: { cls: "badge-blue", label: "Approved" },
      PUBLISHED: { cls: "badge-green", label: "Replied" },
      SKIPPED: { cls: "badge-slate", label: "Skipped" },
    };
    const m = map[status] || { cls: "badge-slate", label: status };
    return <span className={`badge ${m.cls}`}>{m.label}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppNav />
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="h-8 w-32 bg-slate-200 rounded-lg animate-skeleton mb-2" />
          <div className="h-4 w-64 bg-slate-200 rounded animate-skeleton mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-5 h-40 animate-skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav />

      <div className="mx-auto max-w-5xl px-6 py-8 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
            <p className="text-slate-500 text-sm">
              {needsReplyCount > 0
                ? `${needsReplyCount} review${needsReplyCount > 1 ? "s" : ""} need a response`
                : "All caught up!"}
            </p>
          </div>
          <button
            onClick={syncReviews}
            disabled={syncing}
            className="card card-hover text-sm px-4 py-2 flex items-center gap-2 text-slate-700"
          >
            {syncing && <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />}
            {syncing ? "Syncing..." : "Sync reviews"}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
          {[
            { key: "all", label: "All" },
            { key: "needs_reply", label: `Needs reply (${needsReplyCount})` },
            { key: "replied", label: "Replied" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                filter === f.key ? "bg-white font-medium shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-12">
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">No reviews to show</h3>
              <p className="text-slate-500 text-sm max-w-xs">Sync your reviews from Google to see them here and respond with AI-generated replies.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 stagger-children">
            {filtered.map((review) => (
              <div key={review.id} className="card card-hover p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-slate-200 to-slate-100 rounded-full flex items-center justify-center text-sm font-semibold text-slate-600">
                      {review.reviewerName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-800">{review.reviewerName}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 text-sm tracking-wider">{stars(review.rating)}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(review.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.sentiment && (
                      <span className={`badge ${sentimentColor(review.sentiment)}`}>
                        {review.sentiment.toLowerCase()}
                      </span>
                    )}
                    {statusBadge(review.replyStatus)}
                  </div>
                </div>

                {review.comment ? (
                  <p className="text-sm text-slate-700 leading-relaxed mb-3">&ldquo;{review.comment}&rdquo;</p>
                ) : (
                  <p className="text-sm text-slate-400 italic mb-3">Star rating only — no text</p>
                )}

                {review.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {review.keywords.map((kw) => (
                      <span key={kw} className="badge badge-slate">{kw}</span>
                    ))}
                  </div>
                )}

                {/* AI draft reply */}
                {review.aiDraftReply && review.replyStatus === "AI_DRAFTED" && (
                  <div className="bg-violet-50 rounded-xl p-4 mt-3 border border-violet-100/60">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-3.5 h-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                      <span className="text-xs font-semibold text-violet-700">AI suggested reply</span>
                    </div>

                    {editingId === review.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editReply}
                          onChange={(e) => setEditReply(e.target.value)}
                          className="w-full border border-violet-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => approveReply(review.id, editReply)} className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors">
                            Post this reply
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-slate-500 px-3 py-1.5 hover:text-slate-700">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-violet-900 leading-relaxed">{review.aiDraftReply}</p>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => approveReply(review.id)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors">
                            Approve &amp; post
                          </button>
                          <button
                            onClick={() => { setEditingId(review.id); setEditReply(review.aiDraftReply!); }}
                            className="text-xs text-violet-700 bg-violet-100 px-3 py-1.5 rounded-lg hover:bg-violet-200 transition-colors"
                          >
                            Edit first
                          </button>
                          <button onClick={() => skipReply(review.id)} className="text-xs text-slate-500 px-3 py-1.5 hover:text-slate-700 transition-colors">
                            Skip
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Published reply */}
                {review.finalReply && review.replyStatus === "PUBLISHED" && (
                  <div className="bg-emerald-50 rounded-xl p-4 mt-3 border border-emerald-100/60">
                    <div className="text-xs font-semibold text-emerald-700 mb-1.5 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Your reply
                    </div>
                    <p className="text-sm text-emerald-900 leading-relaxed">{review.finalReply}</p>
                    {review.repliedAt && (
                      <div className="text-xs text-emerald-600 mt-2">
                        Replied {new Date(review.repliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    )}
                  </div>
                )}

                {/* Unread — action buttons */}
                {review.replyStatus === "UNREAD" && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => generateReply(review.id)} className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                      Generate AI reply
                    </button>
                    <button onClick={() => skipReply(review.id)} className="text-xs text-slate-500 px-3 py-1.5 hover:text-slate-700 transition-colors">
                      Skip
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ReviewsContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}
