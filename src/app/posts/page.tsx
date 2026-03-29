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
      DRAFT: "bg-gray-100 text-gray-700",
      APPROVED: "bg-blue-50 text-blue-700",
      SCHEDULED: "bg-purple-50 text-purple-700",
      PUBLISHED: "bg-green-50 text-green-700",
      FAILED: "bg-red-50 text-red-700",
    };
    return map[status] || "bg-gray-100 text-gray-700";
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
      <div className="min-h-screen bg-gray-50">
        <AppNav />
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="h-8 w-32 bg-gray-200 rounded animate-skeleton mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-skeleton mb-8" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-32 animate-skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Posts</h1>
            <p className="text-gray-500 text-sm">AI-generated posts for your Google Business Profile</p>
          </div>
          <button
            onClick={generatePosts}
            disabled={generating}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {generating && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {generating ? "Generating..." : "Generate new posts"}
          </button>
        </div>

        <div className="flex gap-1 mb-6">
          {(["all", "draft", "scheduled", "published"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-lg transition capitalize ${
                filter === f ? "bg-white border border-gray-200 font-medium shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f}
              {f !== "all" && (
                <span className="ml-1 text-xs text-gray-400">
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
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-3xl mb-3">✍️</div>
            <h3 className="font-semibold mb-1">No posts yet</h3>
            <p className="text-gray-500 text-sm mb-4">Generate your first batch of AI-powered posts</p>
            <button
              onClick={generatePosts}
              disabled={generating}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Generate posts
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((post) => (
              <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{topicLabel(post.topicType)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(post.status)}`}>
                        {post.status.toLowerCase().replace("_", " ")}
                      </span>
                      {post.aiGenerated && (
                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">AI generated</span>
                      )}
                    </div>

                    {editingId === post.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                        />
                        <div className="flex items-center gap-2">
                          <button onClick={() => updatePost(post.id)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 px-3 py-1">Cancel</button>
                          <span className="text-xs text-gray-400 ml-auto">{editContent.length}/300 characters</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
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
                            className="text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button onClick={() => approvePost(post.id)} className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100">
                            Approve
                          </button>
                        </>
                      )}
                      {(post.status === "APPROVED" || post.status === "SCHEDULED") && (
                        <button onClick={() => publishPost(post.id)} className="text-xs text-green-700 bg-green-50 px-3 py-1 rounded-lg hover:bg-green-100">
                          Publish now
                        </button>
                      )}
                      {post.status !== "PUBLISHED" && (
                        confirmDeleteId === post.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => deletePost(post.id)} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-lg">Confirm</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-gray-500 px-2 py-1">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(post.id)} className="text-xs text-red-500 px-2 py-1 rounded hover:bg-red-50">
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
