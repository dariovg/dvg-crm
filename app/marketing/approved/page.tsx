"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import SocialPostCard from "@/components/marketing/SocialPostCard";
import PublishButton from "@/components/marketing/PublishButton";
import EmptyState from "@/components/EmptyState";
import { MarketingPostsSkeleton } from "@/components/Skeleton";
import PlatformStatusBar from "@/components/marketing/PlatformStatusBar";

interface Post {
  id: string;
  content: string;
  platform: string;
  status: string;
  scheduledAt?: string | null;
  createdAt: string;
  errorMessage?: string | null;
  publishAttempts?: number;
  createdBy?: { name: string } | null;
  campaign?: { name: string };
}

export default function ApprovedPostsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [ready, setReady] = useState<Post[]>([]);
  const [scheduled, setScheduled] = useState<Post[]>([]);
  const [failed, setFailed] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [xReady, setXReady] = useState(false);
  const [xIssue, setXIssue] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [approvedRes, scheduledRes, failedRes, statusRes] = await Promise.all([
        fetch("/api/marketing/posts?status=APPROVED"),
        fetch("/api/marketing/posts?status=SCHEDULED"),
        fetch("/api/marketing/posts?status=FAILED"),
        fetch("/api/marketing/status?verify=1"),
      ]);
      const approved = await approvedRes.json();
      const sched = await scheduledRes.json();
      const fail = await failedRes.json();
      const status = statusRes.ok
        ? await statusRes.json()
        : { twitter: { configured: false, ready: false }, statusError: statusRes.status };
      setReady(approved.posts || []);
      setScheduled(sched.posts || []);
      setFailed(fail.posts || []);
      const tw = status.twitter;
      const configured =
        typeof tw === "object" && tw
          ? (tw.configured ?? (tw.missing?.length ? false : tw.ready))
          : false;
      const verified =
        typeof tw === "boolean" ? tw : !!(tw?.ready && !tw?.error);
      setXReady(configured && verified);
      if (typeof tw === "object" && tw) {
        if (tw.missing?.length) {
          setXIssue(`Falta en Vercel: ${tw.missing.join(", ")}`);
        } else if (tw.error) {
          setXIssue(`X API: ${tw.error}`);
        } else if (status.statusError) {
          setXIssue(
            `No se pudo comprobar el estado (HTTP ${status.statusError}). Recarga la página.`
          );
        } else if (configured && !verified) {
          setXIssue("Variables detectadas pero la verificación con X falló.");
        } else {
          setXIssue(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function removePost(id: string) {
    setReady((prev) => prev.filter((p) => p.id !== id));
    setScheduled((prev) => prev.filter((p) => p.id !== id));
    setFailed((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return <MarketingPostsSkeleton />;
  }

  return (
    <div className="page-pad">
      <header className="page-head">
        <div>
          <h1>Listo para publicar</h1>
          <p className="page-sub">
            Posts aprobados — publícalos en un clic cuando tengas la API de X configurada
          </p>
        </div>
        <Link href="/marketing/create" className="btn btn-primary">
          + Crear contenido
        </Link>
      </header>

      <Suspense fallback={null}>
        <PlatformStatusBar compact />
      </Suspense>

      {!xReady && isAdmin && (
        <div className="alert alert-warn">
          <strong>X no publicará automáticamente.</strong>{" "}
          {xIssue || "Revisa las variables en Vercel."} Mientras tanto puedes copiar el
          texto y publicar manualmente.
        </div>
      )}

      <section className="marketing-section">
        <h2 className="panel-title">
          Publicar ahora ({ready.length})
        </h2>
        {ready.length === 0 ? (
          <EmptyState
            className="empty-state-card--wide"
            icon="marketing"
            title="Nada listo para publicar"
            description="Aprueba posts pendientes o crea contenido nuevo."
            actionLabel="Ver pendientes"
            actionHref="/marketing/pending"
          />
        ) : (
          <div className="marketing-post-list">
            {ready.map((post) => (
              <div key={post.id} className="panel">
                <SocialPostCard post={post} />
                {isAdmin && (
                  <div className="marketing-approval-actions">
                    <PublishButton
                      postId={post.id}
                      platform={post.platform}
                      onPublished={() => removePost(post.id)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {scheduled.length > 0 && (
        <section className="marketing-section">
          <h2 className="panel-title">Programados ({scheduled.length})</h2>
          <p className="muted" style={{ marginBottom: "1rem" }}>
            Se publicarán solos cuando llegue la hora (cron cada hora, con reintentos automáticos).
          </p>
          <div className="marketing-post-list">
            {scheduled.map((post) => (
              <div key={post.id} className="panel">
                <SocialPostCard post={post} />
                {post.scheduledAt && (
                  <p className="muted">
                    Programado:{" "}
                    {new Date(post.scheduledAt).toLocaleString("es-ES")}
                  </p>
                )}
                {isAdmin && (
                  <div className="marketing-approval-actions">
                    <PublishButton
                      postId={post.id}
                      platform={post.platform}
                      onPublished={() => removePost(post.id)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {failed.length > 0 && (
        <section className="marketing-section">
          <h2 className="panel-title">Fallos de publicación ({failed.length})</h2>
          <p className="muted" style={{ marginBottom: "1rem" }}>
            Tras 3 intentos fallidos el post queda en error. Puedes volver a publicar manualmente.
          </p>
          <div className="marketing-post-list">
            {failed.map((post) => (
              <div key={post.id} className="panel">
                <SocialPostCard post={post} />
                {isAdmin && (
                  <div className="marketing-approval-actions">
                    <PublishButton
                      postId={post.id}
                      platform={post.platform}
                      onPublished={() => removePost(post.id)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
