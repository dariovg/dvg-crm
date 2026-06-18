"use client";

import { useState } from "react";
import { updateContactNotes, updateContactStatus } from "@/app/actions";
import { CONTACT_STATUSES } from "@/lib/constants";

export default function ContactEditor({ contact }) {
  const [notes, setNotes] = useState(contact.notes || "");
  const [status, setStatus] = useState(contact.status);
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
