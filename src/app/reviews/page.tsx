"use client";

import { useEffect, useState } from "react";

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  publishedAt: string;
  aiDraftReply: string | null;
  finalReply: string | null;
  replyStatus: string;
  sentiment: string | null;
  keywords: string[];
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<"all" | "needs_reply" | "replied">("all");
  const [syncing, setSyncing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReply, setEditReply] = useState("");

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = () => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews || []));
  };

  const syncReviews = async () => {
    setSyncing(true);
    await fetch("/api/reviews/sync", { method: "POST" });
    await fetchReviews();
    setSyncing(false);
  };

  const generateReply = async (id: string) => {
    await fetch(`/api/reviews/${id}/generate-reply`, { method: "POST" });
    fetchReviews();
  };

  const approveReply = async (id: string, customReply?: string) => {
    await fetch(`/api/reviews/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: customReply }),
    });
    setEditingId(null);
    fetchReviews();
  };

  const skipReply = async (id: string) => {
    await fetch(`/api/reviews/${id}/skip`, { method: "POST" });
    fetchReviews();
  };

  const filtered = reviews.filter((r) => {
    if (filter === "all") return true;
    if (filter === "needs_reply")
      return r.replyStatus === "UNREAD" || r.replyStatus === "AI_DRAFTED";
    if (filter === "replied")
      return r.replyStatus === "PUBLISHED" || r.replyStatus === "APPROVED";
    return true;
  });

  const needsReplyCount = reviews.filter(
    (r) => r.replyStatus === "UNREAD" || r.replyStatus === "AI_DRAFTED"
  ).length;

  const stars = (rating: number) => "★".repeat(rating) + "☆".repeat(5 - rating);

  const sentimentColor = (s: string | null) => {
    if (s === "POSITIVE") return "text-green-600 bg-green-50";
    if (s === "NEGATIVE") return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; label: string }> = {
      UNREAD: { bg: "bg-yellow-50 text-yellow-700", label: "Needs reply" },
      AI_DRAFTED: { bg: "bg-purple-50 text-purple-700", label: "AI draft ready" },
      APPROVED: { bg: "bg-blue-50 text-blue-700", label: "Approved" },
      PUBLISHED: { bg: "bg-green-50 text-green-700", label: "Replied" },
      SKIPPED: { bg: "bg-gray-50 text-gray-500", label: "Skipped" },
    };
    const m = map[status] || { bg: "bg-gray-100 text-gray-700", label: status };
    return <span className={`text-xs px-2 py-0.5 rounded-full ${m.bg}`}>{m.label}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
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
              <a href="/dashboard" className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-50">
                Dashboard
              </a>
              <a href="/posts" className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-50">
                Posts
              </a>
              <a href="/reviews" className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-900 font-medium">
                Reviews
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Reviews</h1>
            <p className="text-gray-500 text-sm">
              {needsReplyCount > 0
                ? `${needsReplyCount} review${needsReplyCount > 1 ? "s" : ""} need a response`
                : "All caught up!"}
            </p>
          </div>
          <button
            onClick={syncReviews}
            disabled={syncing}
            className="bg-white border border-gray-200 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync reviews"}
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-1 mb-6">
          {[
            { key: "all", label: "All" },
            { key: "needs_reply", label: `Needs reply (${needsReplyCount})` },
            { key: "replied", label: "Replied" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                filter === f.key
                  ? "bg-white border border-gray-200 font-medium shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Reviews list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-3xl mb-3">⭐</div>
            <h3 className="font-semibold mb-1">No reviews to show</h3>
            <p className="text-gray-500 text-sm">
              Sync your reviews from Google to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((review) => (
              <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5">
                {/* Review header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                      {review.reviewerName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{review.reviewerName}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500 text-sm tracking-wider">
                          {stars(review.rating)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(review.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.sentiment && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sentimentColor(review.sentiment)}`}>
                        {review.sentiment.toLowerCase()}
                      </span>
                    )}
                    {statusBadge(review.replyStatus)}
                  </div>
                </div>

                {/* Review text */}
                {review.comment ? (
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic mb-3">Star rating only — no text</p>
                )}

                {/* Keywords */}
                {review.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {review.keywords.map((kw) => (
                      <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* AI Draft reply */}
                {review.aiDraftReply && review.replyStatus === "AI_DRAFTED" && (
                  <div className="bg-purple-50 rounded-lg p-4 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-purple-700">AI suggested reply</span>
                    </div>

                    {editingId === review.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editReply}
                          onChange={(e) => setEditReply(e.target.value)}
                          className="w-full border border-purple-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveReply(review.id, editReply)}
                            className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg"
                          >
                            Post this reply
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-gray-500 px-3 py-1.5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-purple-900">{review.aiDraftReply}</p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => approveReply(review.id)}
                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                          >
                            Approve &amp; post
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(review.id);
                              setEditReply(review.aiDraftReply!);
                            }}
                            className="text-xs text-purple-700 bg-purple-100 px-3 py-1.5 rounded-lg hover:bg-purple-200"
                          >
                            Edit first
                          </button>
                          <button
                            onClick={() => skipReply(review.id)}
                            className="text-xs text-gray-500 px-3 py-1.5 hover:text-gray-700"
                          >
                            Skip
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Published reply */}
                {review.finalReply && review.replyStatus === "PUBLISHED" && (
                  <div className="bg-green-50 rounded-lg p-4 mt-3">
                    <div className="text-xs font-medium text-green-700 mb-1">Your reply</div>
                    <p className="text-sm text-green-900">{review.finalReply}</p>
                    {review.repliedAt && (
                      <div className="text-xs text-green-600 mt-2">
                        Replied{" "}
                        {new Date(review.publishedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions for unread reviews */}
                {review.replyStatus === "UNREAD" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => generateReply(review.id)}
                      className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700"
                    >
                      Generate AI reply
                    </button>
                    <button
                      onClick={() => skipReply(review.id)}
                      className="text-xs text-gray-500 px-3 py-1.5 hover:text-gray-700"
                    >
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
