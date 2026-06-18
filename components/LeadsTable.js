"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { assignContact } from "@/app/actions";
import StatusBadge from "@/components/StatusBadge";
import AssigneeBadge from "@/components/AssigneeBadge";
import { SOURCE_LABEL } from "@/lib/constants";
import { CONTACT_STATUSES } from "@/lib/constants";

export default function LeadsFilters({ team, isAdmin }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

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

  return (
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
      {isAdmin && (
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
  );
}

export function LeadsTable({ contacts, team, isAdmin }) {
  const router = useRouter();

  async function onAssign(contactId, assigneeId) {
    await assignContact(contactId, assigneeId || null);
    router.refresh();
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th>Origen</th>
            {isAdmin && <th>Asignado a</th>}
            <th>Creado</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr key={c.id}>
              <td>
                <Link href={`/leads/${c.id}`}>{c.name}</Link>
              </td>
              <td>{c.email}</td>
              <td>{c.phone || "—"}</td>
              <td>
                <StatusBadge status={c.status} />
              </td>
              <td>{SOURCE_LABEL[c.source] || c.source}</td>
              {isAdmin && (
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
  );
}
