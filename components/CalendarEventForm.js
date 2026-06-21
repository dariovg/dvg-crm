"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createTeamCalendarEvent,
  updateTeamCalendarEvent,
  deleteTeamCalendarEvent,
} from "@/app/actions";
import { EVENT_AUDIENCES, EVENT_CATEGORIES } from "@/lib/team-calendar";

function toLocalInputValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultStartValue() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return toLocalInputValue(d);
}

export default function CalendarEventForm({ event, onDone, onCancel }) {
  const router = useRouter();
  const editing = !!event;
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [startsAt, setStartsAt] = useState(
    event?.startsAt ? toLocalInputValue(event.startsAt) : defaultStartValue()
  );
  const [endsAt, setEndsAt] = useState(
    event?.endsAt ? toLocalInputValue(event.endsAt) : ""
  );
  const [category, setCategory] = useState(event?.category || "TRAINING");
  const [audience, setAudience] = useState(event?.audience || "ALL");
  const [location, setLocation] = useState(event?.location || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      title,
      description,
      startsAt,
      endsAt: endsAt || null,
      category,
      audience,
      location,
    };
    try {
      if (editing) {
        await updateTeamCalendarEvent(event.id, payload);
      } else {
        await createTeamCalendarEvent(payload);
      }
      router.refresh();
      onDone?.();
    } catch (err) {
      setError(err.message || "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!event?.id) return;
    if (!window.confirm(`¿Eliminar "${event.title}"?`)) return;
    setBusy(true);
    setError("");
    try {
      await deleteTeamCalendarEvent(event.id);
      router.refresh();
      onDone?.();
    } catch (err) {
      setError(err.message || "No se pudo eliminar");
      setBusy(false);
    }
  }

  return (
    <form className="calendar-event-form card" onSubmit={handleSubmit}>
      <h2>{editing ? "Editar evento" : "Nuevo evento de equipo"}</h2>
      <p className="page-lead">
        Formaciones, novedades, reuniones internas… El equipo recibirá una alerta en{" "}
        <strong>Notificaciones</strong>.
      </p>

      <div className="field">
        <label>Título</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Formación producto IA"
          required
          maxLength={120}
        />
      </div>

      <div className="calendar-event-form-row">
        <div className="field">
          <label>Categoría</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {Object.entries(EVENT_CATEGORIES).map(([id, meta]) => (
              <option key={id} value={id}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Para quién</label>
          <select value={audience} onChange={(e) => setAudience(e.target.value)}>
            {Object.entries(EVENT_AUDIENCES).map(([id, meta]) => (
              <option key={id} value={id}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="calendar-event-form-row">
        <div className="field">
          <label>Inicio</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Fin (opcional)</label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label>Ubicación / enlace (opcional)</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Sala, Meet, dirección…"
          maxLength={200}
        />
      </div>

      <div className="field">
        <label>Descripción (opcional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Detalles para el equipo…"
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="calendar-event-form-actions">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Guardando…" : editing ? "Guardar cambios" : "Crear y notificar"}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
        )}
        {editing && (
          <button
            type="button"
            className="btn-danger"
            onClick={handleDelete}
            disabled={busy}
          >
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}
