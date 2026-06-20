"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  updateContactNotes,
  updateContactStatus,
  assignContact,
  updateContactDetails,
  updateContactProfile,
  deleteContact,
} from "@/app/actions";
import { CONTACT_STATUSES, LOST_REASONS } from "@/lib/constants";

export default function ContactEditor({
  contact,
  team = [],
  canAssign = false,
  canDelete = false,
}) {
  const router = useRouter();
  const [name, setName] = useState(contact.name || "");
  const [email, setEmail] = useState(contact.email || "");
  const [phone, setPhone] = useState(contact.phone || "");
  const [company, setCompany] = useState(contact.company || "");
  const [interest, setInterest] = useState(contact.interest || "");
  const [notes, setNotes] = useState(contact.notes || "");
  const [status, setStatus] = useState(contact.status);
  const [lostReason, setLostReason] = useState(contact.lostReason || "");
  const [assigneeId, setAssigneeId] = useState(contact.assigneeId || "");
  const [dealValue, setDealValue] = useState(contact.dealValue ?? "");
  const [tags, setTags] = useState((contact.tags || []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const ok = window.confirm(
      `¿Eliminar el lead "${contact.name}"?\n\nSe borrarán también citas, tareas, presupuestos e historial. Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    setDeleting(true);
    setError("");
    try {
      await deleteContact(contact.id);
      router.push("/leads");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateContactProfile(contact.id, {
        name,
        email,
        phone,
        company,
        interest,
      });
      router.refresh();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

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
    <div className="card contact-editor">
      <h2>Editar lead</h2>

      <form onSubmit={saveProfile} className="contact-editor-section">
        <h3 className="contact-editor-sub">Datos de contacto</h3>
        <div className="field">
          <label>Nombre *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label>Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Teléfono</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="field">
          <label>Empresa</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="field">
          <label>Interés</label>
          <input value={interest} onChange={(e) => setInterest(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          Guardar datos
        </button>
      </form>

      <div className="contact-editor-section">
        <h3 className="contact-editor-sub">Pipeline</h3>
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
      </div>

      <form onSubmit={saveDetails} className="contact-editor-section">
        <h3 className="contact-editor-sub">Comercial</h3>
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

      <form onSubmit={saveNotes} className="contact-editor-section">
        <h3 className="contact-editor-sub">Notas</h3>
        <div className="field">
          <label>Notas internas</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-sm" disabled={saving}>
          Guardar notas
        </button>
      </form>

      {canDelete && (
        <div className="contact-editor-danger">
          <h3 className="contact-editor-sub">Zona de peligro</h3>
          <p className="muted">
            Elimina el lead y todos sus datos relacionados (citas, tareas, presupuestos).
          </p>
          <button
            type="button"
            className="btn-danger"
            onClick={handleDelete}
            disabled={deleting || saving}
          >
            {deleting ? "Eliminando…" : "Eliminar lead"}
          </button>
        </div>
      )}
    </div>
  );
}
