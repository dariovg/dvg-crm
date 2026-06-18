"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { assignContact, bulkAssignContacts } from "@/app/actions";
import StatusBadge from "@/components/StatusBadge";
import AssigneeBadge from "@/components/AssigneeBadge";
import LeadScoreBadge from "@/components/LeadScoreBadge";
import { SOURCE_LABEL, CONTACT_STATUSES } from "@/lib/constants";

const STORAGE_KEY = "dvg-crm-saved-filters";

function readSaved() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function LeadsFilters({ team, canAssign }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState([]);
  const [saveName, setSaveName] = useState("");

  useEffect(() => {
    setSaved(readSaved());
  }, []);

  const setParam = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      startTransition(() => {
        router.push(`/leads?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  function applySaved(filter) {
    const params = new URLSearchParams(filter.params);
    router.push(`/leads?${params.toString()}`);
  }

  function saveCurrent() {
    if (!saveName.trim()) return;
    const entry = {
      id: Date.now().toString(),
      name: saveName.trim(),
      params: searchParams.toString(),
    };
    const next = [...saved.filter((s) => s.name !== entry.name), entry];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(next);
    setSaveName("");
  }

  function removeSaved(id) {
    const next = saved.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(next);
  }

  return (
    <div className="filters-wrap">
      <div className="filters-bar">
        <input
          type="search"
          className="filter-input"
          placeholder="Buscar nombre, email, empresa…"
          defaultValue={searchParams.get("q") || ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") setParam("q", e.target.value.trim());
          }}
        />
        <select
          className="filter-select"
          value={searchParams.get("status") || ""}
          onChange={(e) => setParam("status", e.target.value)}
          disabled={pending}
        >
          <option value="">Todos los estados</option>
          {CONTACT_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={searchParams.get("source") || ""}
          onChange={(e) => setParam("source", e.target.value)}
          disabled={pending}
        >
          <option value="">Todos los orígenes</option>
          {Object.entries(SOURCE_LABEL).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        {canAssign && (
          <select
            className="filter-select"
            value={searchParams.get("assignee") || ""}
            onChange={(e) => setParam("assignee", e.target.value)}
            disabled={pending}
          >
            <option value="">Todos (asignación)</option>
            <option value="none">Sin asignar</option>
            {team.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="saved-filters">
        {saved.map((f) => (
          <span key={f.id} className="saved-filter-chip">
            <button type="button" onClick={() => applySaved(f)}>
              {f.name}
            </button>
            <button
              type="button"
              className="chip-remove"
              onClick={() => removeSaved(f.id)}
              aria-label="Eliminar vista"
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="saved-filter-name"
          placeholder="Nombre vista…"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
        />
        <button type="button" className="btn-sm btn-ghost" onClick={saveCurrent}>
          Guardar filtros
        </button>
      </div>
    </div>
  );
}

export function LeadsTable({ contacts, team, canAssign }) {
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [bulkAssignee, setBulkAssignee] = useState("");

  function toggle(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function onAssign(contactId, assigneeId) {
    await assignContact(contactId, assigneeId || null);
    router.refresh();
  }

  async function runBulk() {
    if (!selected.length) return;
    await bulkAssignContacts(selected, bulkAssignee || null);
    setSelected([]);
    router.refresh();
  }

  return (
    <>
      {canAssign && selected.length > 0 && (
        <div className="bulk-bar">
          <span>{selected.length} seleccionados</span>
          <select
            className="assign-select"
            value={bulkAssignee}
            onChange={(e) => setBulkAssignee(e.target.value)}
          >
            <option value="">Sin asignar</option>
            {team.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
          <button type="button" className="btn-sm" onClick={runBulk}>
            Asignar
          </button>
        </div>
      )}
      <div className="leads-cards">
        {contacts.map((c) => (
          <article key={c.id} className="lead-card">
            <div className="lead-card-head">
              {canAssign && (
                <input
                  type="checkbox"
                  className="lead-card-check"
                  checked={selected.includes(c.id)}
                  onChange={() => toggle(c.id)}
                  aria-label={`Seleccionar ${c.name}`}
                />
              )}
              <Link href={`/leads/${c.id}`} className="lead-card-title">
                {c.name}
              </Link>
              <StatusBadge status={c.status} />
            </div>
            <p className="lead-card-email">{c.email}</p>
            <div className="lead-card-meta">
              {c.dealValue && <span>{c.dealValue} €</span>}
              {c.leadScore != null && <LeadScoreBadge score={c.leadScore} />}
              <span>{SOURCE_LABEL[c.source] || c.source}</span>
              <span>{new Date(c.createdAt).toLocaleDateString("es-ES")}</span>
            </div>
            {c.tags?.length > 0 && (
              <div className="tag-list">
                {c.tags.map((t) => (
                  <span key={t} className="tag-chip">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {canAssign && (
              <div className="lead-card-assign">
                <select
                  className="assign-select"
                  value={c.assigneeId || ""}
                  onChange={(e) => onAssign(c.id, e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {team.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
                {c.assignee && (
                  <AssigneeBadge user={c.assignee} className="assign-badge-inline" />
                )}
              </div>
            )}
          </article>
        ))}
        {!contacts.length && (
          <p className="empty-state">No hay leads con estos filtros.</p>
        )}
      </div>
      <div className="table-wrap table-wrap--desktop">
        <table className="data-table">
          <thead>
            <tr>
              {canAssign && <th className="th-check" />}
              <th>Nombre</th>
              <th>Email</th>
              <th>Valor</th>
              <th>Score</th>
              <th>Estado</th>
              <th>Origen</th>
              {canAssign && <th>Asignado a</th>}
              <th>Creado</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                {canAssign && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={() => toggle(c.id)}
                    />
                  </td>
                )}
                <td>
                  <Link href={`/leads/${c.id}`}>{c.name}</Link>
                  {c.tags?.length > 0 && (
                    <div className="tag-list">
                      {c.tags.map((t) => (
                        <span key={t} className="tag-chip">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td>{c.email}</td>
                <td>{c.dealValue ? `${c.dealValue} €` : "—"}</td>
                <td>{c.leadScore != null ? <LeadScoreBadge score={c.leadScore} /> : "—"}</td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
                <td>{SOURCE_LABEL[c.source] || c.source}</td>
                {canAssign && (
                  <td>
                    <select
                      className="assign-select"
                      value={c.assigneeId || ""}
                      onChange={(e) => onAssign(c.id, e.target.value)}
                    >
                      <option value="">Sin asignar</option>
                      {team.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name || u.email}
                        </option>
                      ))}
                    </select>
                    {c.assignee && (
                      <AssigneeBadge user={c.assignee} className="assign-badge-inline" />
                    )}
                  </td>
                )}
                <td>{new Date(c.createdAt).toLocaleDateString("es-ES")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!contacts.length && (
          <p className="empty-state">No hay leads con estos filtros.</p>
        )}
      </div>
    </>
  );
}
