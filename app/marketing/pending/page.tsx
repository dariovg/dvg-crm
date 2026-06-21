"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import SocialPostCard from "@/components/marketing/SocialPostCard";
import ApprovalButtons from "@/components/marketing/ApprovalButtons";
import EmptyState from "@/components/EmptyState";
import { MarketingPostsSkeleton } from "@/components/Skeleton";
import { useLocale } from "@/components/LocaleProvider";

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
  const { t } = useLocale();
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
        throw new Error("fetch_error");
      }

      const data = await response.json();
      setPosts(data.posts);
      setTotalCount(data.total);
      setError(null);
    } catch (err) {
      console.error("Error:", err);
      setError(t("marketing.loadError"));
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
        setError(t("marketing.approveError"));
      }
    } catch (err) {
      console.error("Error:", err);
      setError(t("marketing.approveError"));
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
        setError(t("marketing.rejectError"));
      }
    } catch (err) {
      console.error("Error:", err);
      setError(t("marketing.rejectError"));
    }
  }

  if (loading) {
    return <MarketingPostsSkeleton />;
  }

  return (
    <div className="page-pad">
      <header className="page-head">
        <div>
          <h1>{t("marketing.pendingTitle")}</h1>
          <p className="page-sub">
            {isAdmin ? t("marketing.pendingAdmin") : t("marketing.pendingUser")}
          </p>
        </div>
        <span className="marketing-count-badge">{totalCount}</span>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {posts.length === 0 ? (
        <EmptyState
          className="empty-state-card--wide"
          icon="marketing"
          title={t("marketing.emptyPending")}
          description={t("marketing.emptyPendingDesc")}
          actionLabel={t("marketing.createContent")}
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
