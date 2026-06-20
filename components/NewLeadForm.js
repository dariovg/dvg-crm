"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createManualContact } from "@/app/actions";
import Link from "next/link";

export default function NewLeadForm({ team, canAssign }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [duplicate, setDuplicate] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    interest: "",
    notes: "",
    dealValue: "",
    assigneeId: "",
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  useEffect(() => {
    function openForm() {
      setOpen(true);
    }
    window.addEventListener("crm:new-lead", openForm);
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") setOpen(true);
    return () => window.removeEventListener("crm:new-lead", openForm);
  }, []);

  async function submit(allowDuplicate = false) {
    setPending(true);
    setDuplicate(null);
    setError("");
    try {
      const result = await createManualContact({ ...form, allowDuplicate });
      if (!result.ok) {
        setDuplicate(result.duplicate);
        return;
      }
      setOpen(false);
      router.push(`/leads/${result.contactId}`);
      router.refresh();
    } catch (err) {
      setError(err.message || "No se pudo crear el lead");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        + Nuevo lead
      </button>
    );
  }

  return (
    <div className="card new-lead-card">
      <h2>Nuevo lead</h2>
      {error && <p className="form-error">{error}</p>}
      {duplicate && (
        <div className="alert-warn">
          Ya existe <Link href={`/leads/${duplicate.id}`}>{duplicate.name}</Link>{" "}
          ({duplicate.email}).
          <button
            type="button"
            className="btn-sm"
            style={{ marginLeft: ".5rem" }}
            onClick={() => submit(true)}
          >
            Crear igualmente
          </button>
        </div>
      )}
      <div className="field">
        <label>Nombre *</label>
        <input
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label>Email *</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label>Teléfono</label>
        <input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
      </div>
      <div className="field">
        <label>Empresa</label>
        <input value={form.company} onChange={(e) => update("company", e.target.value)} />
      </div>
      <div className="field">
        <label>Interés</label>
        <input value={form.interest} onChange={(e) => update("interest", e.target.value)} />
      </div>
      <div className="field">
        <label>Valor estimado (€)</label>
        <input
          type="number"
          min="0"
          value={form.dealValue}
          onChange={(e) => update("dealValue", e.target.value)}
        />
      </div>
      {canAssign && (
        <div className="field">
          <label>Asignar a</label>
          <select
            className="assign-select"
            value={form.assigneeId}
            onChange={(e) => update("assigneeId", e.target.value)}
          >
            <option value="">Sin asignar (o auto si eres equipo)</option>
            {team.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="field">
        <label>Notas</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </div>
      <div className="form-actions">
        <button
          type="button"
          className="btn-primary"
          disabled={pending || !form.name || !form.email}
          onClick={() => submit(false)}
        >
          Crear lead
        </button>
        <button type="button" className="btn-sm btn-ghost" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
