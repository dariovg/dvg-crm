// app/marketing/published/page.tsx
"use client";

import { useEffect, useState } from "react";
import SocialPostCard from "@/components/marketing/SocialPostCard";
import EmptyState from "@/components/EmptyState";
import { MarketingPublishedSkeleton } from "@/components/Skeleton";

interface Post {
  id: string;
  platform: string;
  content: string;
  status: string;
  createdBy: { name: string } | null;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  mediaUrls: string[];
  createdAt: string;
  publishedAt: string | null;
}

const PLATFORM_LABELS: Record<string, string> = {
  all: "Todas",
  TWITTER: "X",
  TIKTOK: "TikTok",
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
};

export default function PublishedPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch(
          "/api/marketing/posts?status=PUBLISHED&limit=100"
        );
        const data = await response.json();
        setPosts(data.posts || []);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  const filteredPosts =
    filter === "all"
      ? posts
      : posts.filter((p) => p.platform === filter);

  const platforms = ["all", ...new Set(posts.map((p) => p.platform))];

  const totalLikes = filteredPosts.reduce((acc, p) => acc + p.likes, 0);
  const totalImpressions = filteredPosts.reduce((acc, p) => acc + p.impressions, 0);
  const engagement =
    totalImpressions > 0
      ? ((totalLikes / totalImpressions) * 100).toFixed(1)
      : "0";

  if (loading) {
    return <MarketingPublishedSkeleton />;
  }

  return (
    <div className="page-pad">
      <header className="page-head">
        <div>
          <h1>Publicados</h1>
          <p className="page-sub">Historial de contenido ya publicado en redes</p>
        </div>
      </header>

      <div className="filter-chips">
        {platforms.map((platform) => (
          <button
            key={platform}
            type="button"
            onClick={() => setFilter(platform)}
            className={`filter-chip${filter === platform ? " filter-chip--active" : ""}`}
          >
            {PLATFORM_LABELS[platform] || platform}
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <EmptyState
          className="empty-state-card--wide"
          icon="marketing"
          title="Sin publicaciones"
          description="Los posts publicados en X y TikTok aparecerán aquí."
          actionLabel="Crear contenido"
          actionHref="/marketing/create"
        />
      ) : (
        <div className="marketing-post-grid">
          {filteredPosts.map((post) => (
            <SocialPostCard key={post.id} post={post} showMetrics />
          ))}
        </div>
      )}

      {filteredPosts.length > 0 && (
        <section className="marketing-summary">
          <h2 className="panel-title">Resumen</h2>
          <div className="marketing-kpi-grid marketing-kpi-grid--4">
            <div className="marketing-kpi marketing-kpi--orange">
              <div className="marketing-kpi-value">{filteredPosts.length}</div>
              <div className="marketing-kpi-label">Posts</div>
            </div>
            <div className="marketing-kpi marketing-kpi--green">
              <div className="marketing-kpi-value">
                {totalLikes.toLocaleString("es-ES")}
              </div>
              <div className="marketing-kpi-label">Likes</div>
            </div>
            <div className="marketing-kpi marketing-kpi--blue">
              <div className="marketing-kpi-value">
                {totalImpressions.toLocaleString("es-ES")}
              </div>
              <div className="marketing-kpi-label">Impresiones</div>
            </div>
            <div className="marketing-kpi marketing-kpi--purple">
              <div className="marketing-kpi-value">{engagement}%</div>
              <div className="marketing-kpi-label">Engagement</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
