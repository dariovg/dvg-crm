"use client";

import { useState } from "react";

interface WeekVideoAttachProps {
  postId: string;
  mediaUrls?: string[];
  onSaved: () => void;
}

export default function WeekVideoAttach({
  postId,
  mediaUrls = [],
  onSaved,
}: WeekVideoAttachProps) {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const audioUrl = mediaUrls.find((u) => /\.mp3(\?|$)/i.test(u));
  const videoUrl = mediaUrls.find((u) => !/\.mp3(\?|$)/i.test(u));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/marketing/posts/${postId}/media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setMsg("Vídeo enlazado");
      setUrl("");
      onSaved();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="marketing-week-video-attach">
      {audioUrl && (
        <div className="marketing-week-audio">
          <span className="text-sm font-medium">🔊 Audio referencia (Polly)</span>
          <audio controls src={audioUrl} className="w-full mt-1" preload="metadata">
            Tu navegador no soporta audio.
          </audio>
          <p className="muted text-xs mt-1">
            Graba el reel escuchando este guion o léelo en cámara.
          </p>
        </div>
      )}

      {videoUrl ? (
        <p className="text-sm text-green-700">
          ✅ Vídeo enlazado:{" "}
          <a href={videoUrl} target="_blank" rel="noreferrer" className="underline">
            ver enlace
          </a>
        </p>
      ) : (
        <form onSubmit={handleSave} className="marketing-week-video-form">
          <label className="text-sm font-medium">
            📤 URL de tu vídeo (subido a IG/TikTok/Drive)
          </label>
          <div className="flex gap-2 mt-1 flex-wrap">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm"
              required
            />
            <button
              type="submit"
              disabled={saving || !url.trim()}
              className="btn btn-primary text-sm"
            >
              {saving ? "Guardando…" : "Enlazar vídeo"}
            </button>
          </div>
        </form>
      )}
      {msg && <p className="text-xs mt-1 muted">{msg}</p>}
    </div>
  );
}
