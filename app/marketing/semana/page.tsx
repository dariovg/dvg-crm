"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import SocialPostCard from "@/components/marketing/SocialPostCard";
import ApprovalButtons from "@/components/marketing/ApprovalButtons";
import WeekVideoAttach from "@/components/marketing/WeekVideoAttach";
import { WeekViewSkeleton } from "@/components/Skeleton";

interface WeekPost {
  id: string;
  content: string;
  platform: string;
  status: string;
  createdAt: string;
  scheduledAt?: string | null;
  mediaUrls?: string[];
}

interface WeekDay {
  date: string;
  label: string;
  posts: WeekPost[];
}

interface WeekPayload {
  campaign: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  days: WeekDay[];
  totals?: { posts: number; pending: number; videoPlatforms: number };
  message?: string;
}

const VIDEO_PLATFORMS = new Set(["INSTAGRAM", "TIKTOK", "LINKEDIN"]);

export default function MarketingWeekPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [data, setData] = useState<WeekPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/marketing/week");
      if (!res.ok) throw new Error("Error al cargar semana");
      setData(await res.json());
      setError(null);
    } catch {
      setError("No se pudo cargar la simulación semanal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(postId: string) {
    const res = await fetch(`/api/marketing/posts/${postId}/approve`, {
      method: "POST",
    });
    if (res.ok) load();
  }

  async function handleReject(postId: string, reason: string) {
    const res = await fetch(`/api/marketing/posts/${postId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) load();
  }

  if (loading) {
    return <WeekViewSkeleton />;
  }

  if (error) {
    return (
      <div className="page-pad">
        <p className="alert alert-warn">{error}</p>
      </div>
    );
  }

  if (!data?.campaign) {
    return (
      <div className="page-pad">
        <header className="page-head">
          <div>
            <h1>Vista domingo</h1>
            <p className="page-sub">
              Simulación del batch semanal — aún no generado
            </p>
          </div>
        </header>
        <div className="marketing-card">
          <p>{data?.message}</p>
          <p className="muted">
            Cuando esté desplegado el cron dominical, aquí verás Lun–Dom con
            tweets diarios y packs de vídeo (L/M/V) con audio de referencia.
          </p>
          <Link href="/marketing/pending" className="btn btn-secondary">
            Ir a pendientes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-pad">
      <header className="page-head">
        <div>
          <h1>Vista domingo</h1>
          <p className="page-sub">{data.campaign.name}</p>
          {data.campaign.description && (
            <p className="muted">{data.campaign.description}</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="badge badge-pending">
            {data.totals?.pending ?? 0} por revisar
          </span>
          <Link href="/marketing/pending" className="btn btn-secondary">
            Todos los pendientes
          </Link>
        </div>
      </header>

      <div className="alert alert-info marketing-week-banner">
        <strong>Simulación activa.</strong> Revisa cada día: tweet en X (mañana)
        y reels Lun/Mié/Vie (tarde). Escucha el audio TTS, graba el vídeo tú y
        pega la URL cuando lo tengas en Drive/YouTube/etc.
      </div>

      <div className="marketing-week-grid">
        {data.days.map((day) => {
          const hasVideo = day.posts.some((p) => VIDEO_PLATFORMS.has(p.platform));
          return (
            <section key={day.date} className="marketing-week-day">
              <header className="marketing-week-day-head">
                <h2>{day.label}</h2>
                {hasVideo && (
                  <span className="marketing-week-badge">🎬 Pack vídeo</span>
                )}
              </header>
              <div className="marketing-week-day-posts">
                {day.posts.map((post) => (
                  <div key={post.id} className="marketing-week-post">
                    {post.scheduledAt && (
                      <p className="marketing-week-time">
                        🕐{" "}
                        {new Date(post.scheduledAt).toLocaleString("es-ES", {
                          weekday: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    <SocialPostCard post={post} />
                    {isAdmin && post.status === "PENDING_APPROVAL" && (
                      <ApprovalButtons
                        postId={post.id}
                        onApprove={() => handleApprove(post.id)}
                        onReject={(reason) => handleReject(post.id, reason)}
                      />
                    )}
                    {VIDEO_PLATFORMS.has(post.platform) && isAdmin && (
                      <WeekVideoAttach
                        postId={post.id}
                        mediaUrls={post.mediaUrls}
                        onSaved={load}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
