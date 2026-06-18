"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  updateContactNotes,
  updateContactStatus,
  assignContact,
  updateContactDetails,
} from "@/app/actions";
import { CONTACT_STATUSES, LOST_REASONS } from "@/lib/constants";

export default function ContactEditor({
  contact,
  team = [],
  canAssign = false,
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(contact.notes || "");
  const [status, setStatus] = useState(contact.status);
  const [lostReason, setLostReason] = useState(contact.lostReason || "");
  const [assigneeId, setAssigneeId] = useState(contact.assigneeId || "");
  const [dealValue, setDealValue] = useState(contact.dealValue ?? "");
  const [tags, setTags] = useState((contact.tags || []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function saveNotes(e) {
    e.preventDefault();
    setSaving(true);
    await updateContactNotes(contact.id, notes);
    setSaving(false);
  }

  async function saveDetails(e) {
    e.preventDefault();
    setSaving(true);
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await updateContactDetails(contact.id, {
      dealValue,
      tags: tagList,
    });
    setSaving(false);
    router.refresh();
  }

  async function onStatusChange(e) {
    const next = e.target.value;
    if (next === "LOST" && !lostReason) {
      setStatus(next);
      return;
    }
    setStatus(next);
    setSaving(true);
    setError("");
    try {
      await updateContactStatus(contact.id, next, lostReason);
      router.refresh();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  async function confirmLost() {
    if (!lostReason) {
      setError("Selecciona un motivo");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateContactStatus(contact.id, "LOST", lostReason);
      router.refresh();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  async function onAssignChange(e) {
    const next = e.target.value;
    setAssigneeId(next);
    setSaving(true);
    await assignContact(contact.id, next || null);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="card">
      <h2>Editar</h2>
      <div className="field">
        <label>Estado</label>
        <select value={status} onChange={onStatusChange} disabled={saving}>
          {CONTACT_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {status === "LOST" && contact.status !== "LOST" && (
        <div className="field">
          <label>Motivo de pérdida *</label>
          <select
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
          >
            <option value="">Seleccionar…</option>
            {LOST_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: ".5rem" }}
            onClick={confirmLost}
            disabled={saving}
          >
            Confirmar perdido
          </button>
        </div>
      )}
      {contact.lostReason && (
        <p className="lost-reason-label">
          Motivo: <strong>{contact.lostReason}</strong>
        </p>
      )}
      {canAssign && (
        <div className="field">
          <label>Asignado a</label>
          <select
            value={assigneeId}
            onChange={onAssignChange}
            disabled={saving}
            className="assign-select"
          >
            <option value="">Sin asignar</option>
            {team.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
        </div>
      )}
      <form onSubmit={saveDetails}>
        <div className="field">
          <label>Valor estimado (€)</label>
          <input
            type="number"
            min="0"
            value={dealValue}
            onChange={(e) => setDealValue(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Etiquetas (separadas por coma)</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="urgente, referido"
          />
        </div>
        <button type="submit" className="btn-sm" disabled={saving}>
          Guardar valor y etiquetas
        </button>
      </form>
      <form onSubmit={saveNotes}>
        <div className="field">
          <label>Notas internas</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={saving}>
          Guardar notas
        </button>
      </form>
    </div>
  );
}
