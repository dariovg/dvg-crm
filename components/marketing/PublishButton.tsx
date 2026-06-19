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
  const [url, setUrl] = useState<string | null>(null);

  async function handlePublish() {
    if (!confirm(`¿Publicar ahora en ${platform}?`)) return;

    setLoading(true);
    setError(null);
    setUrl(null);

    try {
      const res = await fetch(`/api/marketing/posts/${postId}/publish`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al publicar");
      }

      if (data.url) setUrl(data.url);
      onPublished?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar");
    } finally {
      setLoading(false);
    }
  }

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
        Ver en X →
      </a>
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
      {error && <p className="alert alert-error" style={{ marginTop: "0.5rem" }}>{error}</p>}
    </div>
  );
}
