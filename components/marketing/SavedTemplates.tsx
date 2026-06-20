"use client";

import { useCallback, useEffect, useState } from "react";
import EmptyState from "@/components/EmptyState";

interface Template {
  id: string;
  name: string;
  content: string;
}

interface SavedTemplatesProps {
  currentContent: string;
  onSelect: (content: string) => void;
}

export default function SavedTemplates({
  currentContent,
  onSelect,
}: SavedTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [error, setError] = useState("");

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/templates");
      if (!res.ok) throw new Error("No se pudieron cargar las plantillas");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedContent = currentContent.trim();
    if (!trimmedName || !trimmedContent) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/marketing/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, content: trimmedContent }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo guardar");
      }
      setName("");
      setShowSaveForm(false);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta plantilla guardada?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/marketing/templates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("No se pudo eliminar la plantilla");
    } finally {
      setDeletingId(null);
    }
  }

  const canSave = currentContent.trim().length > 0;

  return (
    <section className="panel marketing-templates marketing-templates--saved">
      <div className="marketing-templates-head">
        <h2 className="panel-title">Plantillas guardadas</h2>
        {canSave && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowSaveForm((v) => !v)}
          >
            {showSaveForm ? "Cancelar" : "Guardar actual"}
          </button>
        )}
      </div>
      <p className="muted" style={{ marginBottom: "0.75rem" }}>
        Reutiliza textos que guardes desde el editor de abajo.
      </p>

      {showSaveForm && (
        <form onSubmit={handleSave} className="marketing-save-template-form">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la plantilla"
            className="field-input"
            maxLength={80}
            required
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={saving || !name.trim()}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </form>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="muted">Cargando plantillas…</p>
      ) : templates.length === 0 ? (
        <EmptyState
          icon="marketing"
          title="Sin plantillas guardadas"
          description="Escribe un post y pulsa «Guardar actual» para reutilizarlo otro día."
          className="empty-state-card--compact"
        />
      ) : (
        <ul className="marketing-saved-template-list">
          {templates.map((t) => (
            <li key={t.id} className="marketing-saved-template-item">
              <button
                type="button"
                className="marketing-saved-template-use"
                onClick={() => onSelect(t.content)}
              >
                <span className="marketing-saved-template-name">{t.name}</span>
                <span className="marketing-saved-template-preview">
                  {t.content.slice(0, 72)}
                  {t.content.length > 72 ? "…" : ""}
                </span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm marketing-saved-template-delete"
                onClick={() => handleDelete(t.id)}
                disabled={deletingId === t.id}
                aria-label={`Eliminar ${t.name}`}
              >
                {deletingId === t.id ? "…" : "✕"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
