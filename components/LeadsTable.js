"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { assignContact, bulkAssignContacts, bulkDeleteContacts, deleteContact } from "@/app/actions";
import StatusBadge from "@/components/StatusBadge";
import AssigneeBadge from "@/components/AssigneeBadge";
import LeadScoreBadge from "@/components/LeadScoreBadge";
import EmptyState from "@/components/EmptyState";
import { useLocale } from "@/components/LocaleProvider";
import { contactStatusesForLocale, sourceLabelsForLocale, sourceLabel } from "@/lib/i18n-labels";

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
  const { locale, t } = useLocale();
  const statuses = contactStatusesForLocale(locale);
  const sources = sourceLabelsForLocale(locale);
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
          placeholder={t("page.leads.searchPlaceholder")}
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
          <option value="">{t("page.leads.allStatuses")}</option>
          {statuses.map((s) => (
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
          <option value="">{t("page.leads.allSources")}</option>
          {sources.map(({ id, label }) => (
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
            <option value="">{t("page.leads.allAssignees")}</option>
            <option value="none">{t("page.leads.unassigned")}</option>
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
          placeholder={t("page.leads.filterNamePlaceholder")}
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
        />
        <button type="button" className="btn-sm btn-ghost" onClick={saveCurrent}>
          {t("page.leads.saveFilters")}
        </button>
      </div>
    </div>
  );
}

export function LeadsTable({ contacts, team, canAssign, canDelete = false }) {
  const router = useRouter();
  const { locale } = useLocale();
  const [selected, setSelected] = useState([]);
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const showSelection = canAssign || canDelete;
  const contactIds = contacts.map((c) => c.id);
  const allSelected =
    contacts.length > 0 && contactIds.every((id) => selected.includes(id));

  function toggle(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    setSelected(allSelected ? [] : contactIds);
  }

  function clearSelection() {
    setSelected([]);
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

  async function runBulkDelete() {
    if (!selected.length) return;
    const preview = contacts
      .filter((c) => selected.includes(c.id))
      .map((c) => c.name)
      .slice(0, 5);
    const more =
      selected.length > 5 ? `\n…y ${selected.length - 5} más` : "";
    const ok = window.confirm(
      `¿Eliminar ${selected.length} lead(s)?\n\n${preview.join(", ")}${more}\n\nSe borrarán citas, tareas, presupuestos e historial. No se puede deshacer.`
    );
    if (!ok) return;
    setBulkDeleting(true);
    try {
      await bulkDeleteContacts(selected);
      setSelected([]);
      router.refresh();
    } catch (err) {
      window.alert(err.message || "No se pudieron eliminar los leads");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleDelete(contact) {
    const ok = window.confirm(
      `¿Eliminar el lead "${contact.name}"?\n\nSe borrarán también citas, tareas, presupuestos e historial.`
    );
    if (!ok) return;
    setDeletingId(contact.id);
    try {
      await deleteContact(contact.id);
      router.refresh();
    } catch (err) {
      window.alert(err.message || "No se pudo eliminar el lead");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {showSelection && selected.length > 0 && (
        <div className="bulk-bar bulk-bar--sticky">
          <span className="bulk-bar-count">
            {selected.length} seleccionado{selected.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            className="btn-sm btn-ghost"
            onClick={clearSelection}
            disabled={bulkDeleting}
          >
            Desmarcar
          </button>
          {canAssign && (
            <>
              <select
                className="assign-select"
                value={bulkAssignee}
                onChange={(e) => setBulkAssignee(e.target.value)}
                disabled={bulkDeleting}
              >
                <option value="">Sin asignar</option>
                {team.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-sm"
                onClick={runBulk}
                disabled={bulkDeleting}
              >
                Asignar
              </button>
            </>
          )}
          {canDelete && (
            <button
              type="button"
              className="btn-sm btn-danger"
              onClick={runBulkDelete}
              disabled={bulkDeleting}
            >
              {bulkDeleting
                ? "Eliminando…"
                : `Eliminar ${selected.length} lead${selected.length !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      )}
      {showSelection && contacts.length > 0 && selected.length === 0 && canDelete && (
        <p className="leads-bulk-hint">
          Marca los leads con la casilla y usa <strong>Eliminar seleccionados</strong> en la barra superior.
        </p>
      )}
      <div className="leads-cards">
        {contacts.map((c) => (
          <article key={c.id} className="lead-card">
            <div className="lead-card-head">
              {showSelection && (
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
              <span>{sourceLabel(c.source, locale)}</span>
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
            <div className="lead-card-actions">
              <Link href={`/leads/${c.id}`} className="btn-link-sm">
                Editar
              </Link>
              {canDelete && (
                <button
                  type="button"
                  className="btn-link-sm btn-link-danger"
                  onClick={() => handleDelete(c)}
                  disabled={deletingId === c.id}
                >
                  {deletingId === c.id ? "Eliminando…" : "Eliminar"}
                </button>
              )}
            </div>
          </article>
        ))}
        {!contacts.length && (
          <EmptyState
            className="empty-state-card--wide"
            icon="leads"
            title="No hay leads"
            description="No hay resultados con estos filtros. Prueba a ampliar la búsqueda."
          />
        )}
      </div>
      <div className="table-wrap table-wrap--desktop">
        <table className="data-table">
          <thead>
            <tr>
              {showSelection && (
                <th className="th-check">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Seleccionar todos"
                    title="Seleccionar todos"
                  />
                </th>
              )}
              <th>Nombre</th>
              <th>Email</th>
              <th>Valor</th>
              <th>Score</th>
              <th>Estado</th>
              <th>Origen</th>
              {canAssign && <th>Asignado a</th>}
              <th>Creado</th>
              <th className="th-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                {showSelection && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={() => toggle(c.id)}
                      aria-label={`Seleccionar ${c.name}`}
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
                <td>{sourceLabel(c.source, locale)}</td>
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
                <td className="td-actions">
                  <Link href={`/leads/${c.id}`} className="btn-link-sm">
                    Editar
                  </Link>
                  {canDelete && (
                    <button
                      type="button"
                      className="btn-link-sm btn-link-danger"
                      onClick={() => handleDelete(c)}
                      disabled={deletingId === c.id}
                    >
                      {deletingId === c.id ? "…" : "Eliminar"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!contacts.length && (
          <EmptyState
            className="empty-state-card--wide"
            icon="leads"
            title="No hay leads"
            description="No hay resultados con estos filtros. Prueba a ampliar la búsqueda."
          />
        )}
      </div>
    </>
  );
}
