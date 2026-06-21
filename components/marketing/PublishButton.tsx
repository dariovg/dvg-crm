"use client";

import { useState } from "react";

interface PublishButtonProps {
  postId: string;
  platform: string;
  onPublished?: () => void;
}

export default function PublishButton({
  postId,
  platform,
  onPublished,
}: PublishButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handlePublish() {
    if (!confirm(`¿Publicar ahora en ${platform}?`)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    setUrl(null);
    setDone(false);

    try {
      const res = await fetch(`/api/marketing/posts/${postId}/publish`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        const detail =
          data.permanent === false && data.attempts && !/créditos|credits/i.test(data.error || "")
            ? ` (intento ${data.attempts}/3, se reintentará)`
            : "";
        throw new Error((data.error || "Error al publicar") + detail);
      }

      const link =
        data.url ||
        (data.post?.externalId && platform === "TWITTER"
          ? `https://x.com/i/web/status/${data.post.externalId}`
          : null);

      if (link) {
        setUrl(link);
        setSuccess("Publicado correctamente.");
      } else {
        setSuccess(data.message || "Publicado correctamente");
        setDone(true);
        onPublished?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar");
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    setDone(true);
    onPublished?.();
  }

  if (done && !url) {
    return (
      <p className="muted" style={{ marginTop: "0.5rem" }}>
        Publicado — recarga la página si no lo ves en Historial.
      </p>
    );
  }

  if (url) {
    return (
      <div className="publish-action">
        <p className="alert alert-info" style={{ marginBottom: "0.5rem" }}>
          {success || "Publicado correctamente."}
        </p>
        <div className="marketing-approval-actions">
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Ver publicación →
          </a>
          <button type="button" onClick={handleDismiss} className="btn btn-secondary">
            Quitar de la cola
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="publish-action">
      <button
        type="button"
        onClick={handlePublish}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? "Publicando…" : `Publicar en ${platform}`}
      </button>
      {success && (
        <p className="alert alert-info" style={{ marginTop: "0.5rem" }}>
          {success}
        </p>
      )}
      {error && (
        <p className="alert alert-error" style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>
          {error}
        </p>
      )}
    </div>
  );
}
