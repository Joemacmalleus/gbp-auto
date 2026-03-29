"use client";

import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider, useToast } from "@/components/Toast";

interface Post {
  id: string;
  content: string;
  topicType: string;
  status: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  aiGenerated: boolean;
  createdAt: string;
}

function PostsContent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<"all" | "draft" | "scheduled" | "published">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const r = await fetch("/api/posts");
      if (!r.ok) throw new Error();
      const d = await r.json();
      setPosts(d.posts || []);
    } catch {
      toast("Failed to load posts", "error");
    } finally {
      setLoading(false);
    }
  };

  const generatePosts = async () => {
    setGenerating(true);
    try {
      const r = await fetch("/api/posts/generate", { method: "POST" });
      if (!r.ok) throw new Error();
      await fetchPosts();
      toast("New posts generated!");
    } catch {
      toast("Failed to generate posts. Try again.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const approvePost = async (id: string) => {
    try {
      const r = await fetch(`/api/posts/${id}/approve`, { method: "POST" });
      if (!r.ok) throw new Error();
      toast("Post approved");
      fetchPosts();
    } catch {
      toast("Failed to approve post", "error");
    }
  };

  const publishPost = async (id: string) => {
    try {
      const r = await fetch(`/api/posts/${id}/publish`, { method: "POST" });
      if (!r.ok) throw new Error();
      toast("Post published to Google!");
      fetchPosts();
    } catch {
      toast("Failed to publish post", "error");
    }
  };

  const updatePost = async (id: string) => {
    try {
      const r = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (!r.ok) throw new Error();
      setEditingId(null);
      toast("Post updated");
      fetchPosts();
    } catch {
      toast("Failed to update post", "error");
    }
  };

  const deletePost = async (id: string) => {
    try {
      const r = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      setConfirmDeleteId(null);
      toast("Post deleted");
      fetchPosts();
    } catch {
      toast("Failed to delete post", "error");
    }
  };

  const filtered = posts.filter((p) => {
    if (filter === "all") return true;
    if (filter === "draft") return p.status === "DRAFT";
    if (filter === "scheduled") return p.status === "SCHEDULED" || p.status === "APPROVED";
    if (filter === "published") return p.status === "PUBLISHED";
    return true;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: "badge-slate",
      APPROVED: "badge-blue",
      SCHEDULED: "badge-blue",
      PUBLISHED: "badge-green",
      FAILED: "badge-red",
    };
    return map[status] || "badge-slate";
  };

  const topicLabel = (topic: string) => {
    const map: Record<string, string> = {
      GENERAL: "What's new", OFFER: "Offer", EVENT: "Event",
      TIP: "Tip", SEASONAL: "Seasonal", PRODUCT: "Product",
    };
    return map[topic] || topic;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppNav />
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="h-8 w-32 bg-slate-200 rounded-lg animate-skeleton mb-2" />
          <div className="h-4 w-64 bg-slate-200 rounded animate-skeleton mb-8" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-5 h-32 animate-skeleton" />
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
            <h1 className="text-2xl font-bold text-slate-900">Posts</h1>
            <p className="text-slate-500 text-sm">AI-generated posts for your Google Business Profile</p>
          </div>
          <button
            onClick={generatePosts}
            disabled={generating}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {generating && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {generating ? "Generating..." : "Generate new posts"}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
          {(["all", "draft", "scheduled", "published"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 capitalize ${
                filter === f ? "bg-white font-medium shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f}
              {f !== "all" && (
                <span className="ml-1 text-xs text-slate-400">
                  ({posts.filter((p) =>
                    f === "draft" ? p.status === "DRAFT" :
                    f === "scheduled" ? p.status === "SCHEDULED" || p.status === "APPROVED" :
                    p.status === "PUBLISHED"
                  ).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-12">
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">No posts yet</h3>
              <p className="text-slate-500 text-sm mb-4 max-w-xs">Generate your first batch of AI-powered posts tailored to your business.</p>
              <button
                onClick={generatePosts}
                disabled={generating}
                className="bg-blue-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Generate posts
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {filtered.map((post) => (
              <div key={post.id} className="card card-hover p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge badge-slate">{topicLabel(post.topicType)}</span>
                      <span className={`badge ${statusBadge(post.status)}`}>
                        {post.status.toLowerCase().replace("_", " ")}
                      </span>
                      {post.aiGenerated && (
                        <span className="badge" style={{ background: "#f5f3ff", color: "#7c3aed" }}>AI generated</span>
                      )}
                    </div>

                    {editingId === post.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                        />
                        <div className="flex items-center gap-2">
                          <button onClick={() => updatePost(post.id)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-slate-500 px-3 py-1.5 hover:text-slate-700">Cancel</button>
                          <span className="text-xs text-slate-400 ml-auto">{editContent.length}/300 characters</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-700 leading-relaxed">{post.content}</p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <span>Created {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      {post.scheduledFor && (
                        <span>Scheduled {new Date(post.scheduledFor).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                      )}
                      {post.publishedAt && (
                        <span>Published {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      )}
                    </div>
                  </div>

                  {editingId !== post.id && (
                    <div className="flex items-center gap-1">
                      {post.status === "DRAFT" && (
                        <>
                          <button
                            onClick={() => { setEditingId(post.id); setEditContent(post.content); }}
                            className="text-xs text-slate-500 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button onClick={() => approvePost(post.id)} className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                            Approve
                          </button>
                        </>
                      )}
                      {(post.status === "APPROVED" || post.status === "SCHEDULED") && (
                        <button onClick={() => publishPost(post.id)} className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                          Publish now
                        </button>
                      )}
                      {post.status !== "PUBLISHED" && (
                        confirmDeleteId === post.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => deletePost(post.id)} className="text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded-lg hover:bg-red-100 transition-colors">Confirm</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-slate-500 px-2 py-1.5">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(post.id)} className="text-xs text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                            Delete
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostsPage() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <PostsContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}
