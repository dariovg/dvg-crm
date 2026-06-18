"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  updateContactNotes,
  updateContactStatus,
  assignContact,
} from "@/app/actions";
import { CONTACT_STATUSES } from "@/lib/constants";

export default function ContactEditor({ contact, team = [], isAdmin = false }) {
  const router = useRouter();
  const [notes, setNotes] = useState(contact.notes || "");
  const [status, setStatus] = useState(contact.status);
  const [assigneeId, setAssigneeId] = useState(contact.assigneeId || "");
  const [saving, setSaving] = useState(false);

  async function saveNotes(e) {
    e.preventDefault();
    setSaving(true);
    await updateContactNotes(contact.id, notes);
    setSaving(false);
  }

  async function onStatusChange(e) {
    const next = e.target.value;
    setStatus(next);
    setSaving(true);
    await updateContactStatus(contact.id, next);
    setSaving(false);
    router.refresh();
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
      {isAdmin && (
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
      <form onSubmit={saveNotes}>
        <div className="field">
          <label>Notas internas</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          Guardar notas
        </button>
      </form>
    </div>
  );
}
