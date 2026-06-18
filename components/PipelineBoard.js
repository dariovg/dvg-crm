"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateContactStatus } from "@/app/actions";
import AssigneeBadge from "@/components/AssigneeBadge";
import { SOURCE_LABEL } from "@/lib/constants";

export default function PipelineBoard({ columns, allStatuses, isAdmin }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  async function move(contactId, status) {
    await updateContactStatus(contactId, status);
    router.refresh();
  }

  function onDragStart(e, contactId) {
    setDraggingId(contactId);
    e.dataTransfer.setData("text/contact-id", contactId);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e, colId) {
    e.preventDefault();
    setOverCol(colId);
  }

  async function onDrop(e, colId) {
    e.preventDefault();
    const contactId = e.dataTransfer.getData("text/contact-id") || draggingId;
    setDraggingId(null);
    setOverCol(null);
    if (contactId) await move(contactId, colId);
  }

  const statusOptions = (allStatuses || columns).filter(
    (s) => s.id !== "LOST"
  );

  return (
    <div className="pipeline">
      {columns.map((col) => (
        <div
          key={col.id}
          className={`pipeline-col${overCol === col.id ? " pipeline-col--over" : ""}`}
          onDragOver={(e) => onDragOver(e, col.id)}
          onDragLeave={() => setOverCol(null)}
          onDrop={(e) => onDrop(e, col.id)}
        >
          <h3>
            <span className="pipeline-col-dot" data-status={col.id} />
            {col.label}
            <span className="pipeline-col-count">{col.contacts.length}</span>
          </h3>
          <div className="pipeline-col-body">
            {col.contacts.map((c) => {
              const expanded = expandedId === c.id;
              return (
                <div
                  key={c.id}
                  className={`pipeline-card${expanded ? " pipeline-card--expanded" : ""}${draggingId === c.id ? " pipeline-card--dragging" : ""}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, c.id)}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setOverCol(null);
                  }}
                >
                  <button
                    type="button"
                    className="pipeline-card-toggle"
                    onClick={() => setExpandedId(expanded ? null : c.id)}
                  >
                    <strong>{c.name}</strong>
                    {c.assignee && <AssigneeBadge user={c.assignee} />}
                  </button>
                  <span className="pipeline-card-email">{c.email}</span>
                  {expanded && (
                    <div className="pipeline-card-detail">
                      {c.phone && <p>📞 {c.phone}</p>}
                      {c.company && <p>🏢 {c.company}</p>}
                      <p>{SOURCE_LABEL[c.source] || c.source}</p>
                      {c.interest && <p>Interés: {c.interest}</p>}
                      {c.notes && (
                        <p className="pipeline-card-notes">
                          {c.notes.length > 120
                            ? `${c.notes.slice(0, 120)}…`
                            : c.notes}
                        </p>
                      )}
                      <Link href={`/leads/${c.id}`} className="pipeline-card-link">
                        Ver ficha →
                      </Link>
                    </div>
                  )}
                  <select
                    className="pipeline-card-move"
                    defaultValue={c.status}
                    onChange={(e) => move(c.id, e.target.value)}
                    aria-label="Mover estado"
                  >
                    {statusOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        → {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
