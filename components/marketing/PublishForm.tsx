// components/marketing/PublishForm.tsx
"use client";

import { useEffect, useState } from "react";
import { SocialPlatform } from "@prisma/client";

interface PublishFormProps {
  onSubmit?: (data: unknown) => Promise<void>;
  onCancel?: () => void;
  initialContent?: string;
  onPreviewChange?: (data: {
    platform: SocialPlatform;
    content: string;
    imageUrl: string;
  }) => void;
}

const PLATFORMS: {
  value: SocialPlatform;
  label: string;
  icon: string;
  limit: number;
}[] = [
  { value: "TWITTER", label: "X / Twitter", icon: "𝕏", limit: 280 },
  { value: "LINKEDIN", label: "LinkedIn", icon: "💼", limit: 3000 },
  { value: "INSTAGRAM", label: "Instagram", icon: "📷", limit: 2200 },
  { value: "TIKTOK", label: "TikTok", icon: "🎵", limit: 150 },
  { value: "YOUTUBE", label: "YouTube", icon: "▶", limit: 5000 },
  { value: "FACEBOOK", label: "Facebook", icon: "f", limit: 5000 },
];

const PLATFORM_HINTS: Partial<Record<SocialPlatform, string>> = {
  TWITTER:
    "Noticias del día + clips verticales. Texto corto (280). Ideal: titular + enlace o gancho.",
  TIKTOK:
    "Solo vídeo vertical 9:16. Caption breve. Sube el .mp4 en Vista domingo.",
  YOUTUBE:
    "Solo vídeo vertical 9:16. 1ª línea = título del vídeo; resto = descripción. .mp4 en Vista domingo.",
  INSTAGRAM:
    "Solo vídeo o imagen vertical 9:16. Caption largo permitido (publicación manual por ahora).",
  LINKEDIN: "Texto profesional. Vídeo/imagen pendiente de integración automática.",
};

interface Campaign {
  id: string;
  name: string;
}

export function PublishForm({
  onSubmit,
  onCancel,
  initialContent = "",
  onPreviewChange,
}: PublishFormProps) {
  const [formData, setFormData] = useState({
    platform: "TWITTER" as SocialPlatform,
    content: initialContent,
    campaignId: "",
    scheduledAt: "",
    imageUrl: "",
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const activePlatform =
    PLATFORMS.find((p) => p.value === formData.platform) ?? PLATFORMS[0];
  const overLimit = formData.content.length > activePlatform.limit;

  useEffect(() => {
    fetch("/api/marketing/campaigns")
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns || []))
      .catch(() => setCampaigns([]));
  }, []);

  useEffect(() => {
    if (initialContent) {
      setFormData((f) => ({ ...f, content: initialContent }));
    }
  }, [initialContent]);

  useEffect(() => {
    onPreviewChange?.({
      platform: formData.platform,
      content: formData.content,
      imageUrl: formData.imageUrl,
    });
  }, [formData.platform, formData.content, formData.imageUrl, onPreviewChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (overLimit) return;
    setError("");
    setLoading(true);

    try {
      const mediaUrls = formData.imageUrl.trim()
        ? [formData.imageUrl.trim()]
        : [];

      const response = await fetch("/api/marketing/post/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: formData.platform,
          content: formData.content,
          campaignId: formData.campaignId || null,
          scheduledAt: formData.scheduledAt || null,
          mediaUrls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "No se pudo crear el post");
      }

      setSuccess(true);
      setFormData({
        platform: "TWITTER",
        content: "",
        campaignId: "",
        scheduledAt: "",
        imageUrl: "",
      });
      if (onSubmit) await onSubmit(formData);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <h2 className="panel-title">Nuevo post</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && (
        <div className="alert alert-success">
          Enviado a revisión. Cuando lo apruebes, aparecerá en{" "}
          <strong>Listo para publicar</strong>.
        </div>
      )}

      <form onSubmit={handleSubmit} className="marketing-form">
        <div>
          <label className="field-label">Plataforma</label>
          <div className="marketing-platform-grid">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, platform: p.value })
                }
                className={`marketing-platform-btn${
                  formData.platform === p.value
                    ? " marketing-platform-btn--active"
                    : ""
                }`}
              >
                <span className="marketing-platform-icon">{p.icon}</span>
                <span>{p.label}</span>
                <span className="muted">{p.limit} máx.</span>
              </button>
            ))}
          </div>
          {PLATFORM_HINTS[formData.platform] && (
            <p className="field-hint mt-2">{PLATFORM_HINTS[formData.platform]}</p>
          )}
        </div>

        <div>
          <label className="field-label">
            Contenido{" "}
            <span className={overLimit ? "text-danger" : "muted"}>
              ({formData.content.length}/{activePlatform.limit})
            </span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            placeholder="Escribe el mensaje del día para DVG Studio…"
            maxLength={activePlatform.limit + 100}
            className={`field-input field-textarea${
              overLimit ? " field-input--error" : ""
            }`}
            rows={6}
            required
          />
          {overLimit && (
            <p className="text-danger">
              Supera el límite de {activePlatform.label}. Acorta el texto.
            </p>
          )}
        </div>

        <div>
          <label className="field-label">Imagen (URL, opcional)</label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) =>
              setFormData({ ...formData, imageUrl: e.target.value })
            }
            placeholder="https://…"
            className="field-input"
          />
        </div>

        <div>
          <label className="field-label">Programar publicación (opcional)</label>
          <input
            type="datetime-local"
            value={formData.scheduledAt}
            onChange={(e) =>
              setFormData({ ...formData, scheduledAt: e.target.value })
            }
            className="field-input"
          />
          <p className="field-hint">
            Tras aprobar, se publicará solo a esa hora (o manualmente antes).
          </p>
        </div>

        {campaigns.length > 0 && (
          <div>
            <label className="field-label">Campaña</label>
            <select
              value={formData.campaignId}
              onChange={(e) =>
                setFormData({ ...formData, campaignId: e.target.value })
              }
              className="field-input"
            >
              <option value="">Sin campaña</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="marketing-form-actions">
          <button
            type="submit"
            disabled={loading || !formData.content.trim() || overLimit}
            className="btn btn-primary"
          >
            {loading ? "Enviando…" : "Enviar a revisión"}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
