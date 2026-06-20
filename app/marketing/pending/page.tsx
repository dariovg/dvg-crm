// app/marketing/pending/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import SocialPostCard from "@/components/marketing/SocialPostCard";
import ApprovalButtons from "@/components/marketing/ApprovalButtons";
import EmptyState from "@/components/EmptyState";

interface SocialPost {
  id: string;
  content: string;
  platform: string;
  status: string;
  createdAt: string;
  createdBy?: { name: string; email?: string } | null;
  campaign?: { name: string };
}

export default function PendingPostsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchPendingPosts();
  }, []);

  async function fetchPendingPosts() {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/marketing/posts?status=PENDING_APPROVAL"
      );

      if (!response.ok) {
        throw new Error("Error fetching pending posts");
      }

      const data = await response.json();
      setPosts(data.posts);
      setTotalCount(data.total);
      setError(null);
    } catch (err) {
      console.error("Error:", err);
      setError("Error al cargar posts pendientes");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(postId: string) {
    try {
      const response = await fetch(`/api/marketing/posts/${postId}/approve`, {
        method: "POST",
      });

      if (response.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setTotalCount((prev) => Math.max(0, prev - 1));
      } else {
        setError("Error al aprobar post");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Error al aprobar post");
    }
  }

  async function handleReject(postId: string, reason: string) {
    try {
      const response = await fetch(`/api/marketing/posts/${postId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setTotalCount((prev) => Math.max(0, prev - 1));
      } else {
        setError("Error al rechazar post");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Error al rechazar post");
    }
  }

  if (loading) {
    return (
      <div className="page-pad">
        <h1>Pendientes de aprobación</h1>
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="page-pad">
      <header className="page-head">
        <div>
          <h1>Pendientes de aprobación</h1>
          <p className="page-sub">
            {isAdmin
              ? "Revisa y aprueba el contenido antes de publicar"
              : "Tus posts enviados a revisión"}
          </p>
        </div>
        <span className="marketing-count-badge">{totalCount}</span>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {posts.length === 0 ? (
        <EmptyState
          className="empty-state-card--wide"
          icon="marketing"
          title="Sin posts pendientes"
          description="Todo revisado. Crea nuevo contenido cuando quieras."
          actionLabel="Crear contenido"
          actionHref="/marketing/create"
        />
      ) : (
        <div className="marketing-post-list">
          {posts.map((post) => (
            <div key={post.id} className="panel">
              <SocialPostCard post={post} />
              {isAdmin && (
                <div className="marketing-approval-actions">
                  <ApprovalButtons
                    postId={post.id}
                    onApprove={() => handleApprove(post.id)}
                    onReject={(reason) => handleReject(post.id, reason)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
