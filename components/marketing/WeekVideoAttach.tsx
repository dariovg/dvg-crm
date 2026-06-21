"use client";

import { useRef, useState } from "react";

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
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const audioUrl = mediaUrls.find((u) => /\.mp3(\?|$)/i.test(u));
  const videoUrl = mediaUrls.find(
    (u) =>
      !/\.mp3(\?|$)/i.test(u) &&
      !u.includes("blob.vercel-storage.com") &&
      /^https:\/\//i.test(u)
  );

  async function handleLinkUrl(e: React.FormEvent) {
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.append("video", file);
      const res = await fetch(
        `/api/marketing/posts/${postId}/upload-video`,
        { method: "POST", body: form }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir");
      setMsg(`Subido a la app — TikTok usará: ${data.publicUrl}`);
      onSaved();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
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
        </div>
      )}

      {videoUrl ? (
        <p className="text-sm text-green-700">
          ✅ Vídeo listo:{" "}
          <a href={videoUrl} target="_blank" rel="noreferrer" className="underline">
            {videoUrl.includes("/api/marketing/video/")
              ? "en la app (listo para TikTok)"
              : "ver enlace"}
          </a>
        </p>
      ) : (
        <>
          <div className="marketing-week-upload-box">
            <span className="text-sm font-medium">
              📁 Subir vídeo a la app (recomendado para TikTok)
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={handleFileUpload}
              disabled={uploading}
              className="mt-2 text-sm"
            />
            {uploading && <p className="muted text-xs">Subiendo…</p>}
          </div>

          <form onSubmit={handleLinkUrl} className="marketing-week-video-form mt-3">
            <label className="text-sm font-medium muted">
              o pegar URL externa (.mp4)
            </label>
            <div className="flex gap-2 mt-1 flex-wrap">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm"
              />
              <button
                type="submit"
                disabled={saving || !url.trim()}
                className="btn btn-secondary text-sm"
              >
                {saving ? "Guardando…" : "Enlazar URL"}
              </button>
            </div>
          </form>
        </>
      )}
      {msg && <p className="text-xs mt-2 muted">{msg}</p>}
    </div>
  );
}
