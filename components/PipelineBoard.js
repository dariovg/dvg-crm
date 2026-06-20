"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { updateContactStatus } from "@/app/actions";
import AssigneeBadge from "@/components/AssigneeBadge";
import LeadScoreBadge from "@/components/LeadScoreBadge";
import { SOURCE_LABEL } from "@/lib/constants";

function cloneBoard(columns, lost) {
  return {
    columns: columns.map((col) => ({
      ...col,
      contacts: [...col.contacts],
    })),
    lost: [...lost],
  };
}

function findContact(board, contactId) {
  for (const col of board.columns) {
    const idx = col.contacts.findIndex((c) => c.id === contactId);
    if (idx !== -1) {
      return { area: "column", colId: col.id, idx, contact: col.contacts[idx] };
    }
  }
  const lostIdx = board.lost.findIndex((c) => c.id === contactId);
  if (lostIdx !== -1) {
    return { area: "lost", idx: lostIdx, contact: board.lost[lostIdx] };
  }
  return null;
}

function applyMove(board, contactId, targetStatus) {
  const found = findContact(board, contactId);
  if (!found || found.contact.status === targetStatus) return board;

  const contact = { ...found.contact, status: targetStatus };
  const next = cloneBoard(board.columns, board.lost);

  if (found.area === "column") {
    next.columns = next.columns.map((col) =>
      col.id === found.colId
        ? { ...col, contacts: col.contacts.filter((c) => c.id !== contactId) }
        : col
    );
  } else {
    next.lost = next.lost.filter((c) => c.id !== contactId);
  }

  if (targetStatus === "LOST") {
    next.lost = [contact, ...next.lost];
  } else {
    next.columns = next.columns.map((col) =>
      col.id === targetStatus
        ? { ...col, contacts: [contact, ...col.contacts] }
        : col
    );
  }

  return next;
}

function PipelineCard({
  contact,
  expanded,
  dragging,
  pending,
  statusOptions,
  onToggle,
  onDragStart,
  onDragEnd,
  onMoveSelect,
}) {
  return (
    <div
      className={`pipeline-card${expanded ? " pipeline-card--expanded" : ""}${dragging ? " pipeline-card--dragging" : ""}${pending ? " pipeline-card--pending" : ""}`}
      draggable={!pending}
      onDragStart={(e) => {
        if (e.target.closest(".pipeline-card-move, .pipeline-card-toggle, a")) {
          e.preventDefault();
          return;
        }
        onDragStart(e, contact.id);
      }}
      onDragEnd={onDragEnd}
    >
      <button
        type="button"
        className="pipeline-card-toggle"
        onClick={() => onToggle(contact.id)}
      >
        <strong>{contact.name}</strong>
        <span className="pipeline-card-badges">
          {contact.leadScore != null && (
            <LeadScoreBadge score={contact.leadScore} />
          )}
          {contact.assignee && <AssigneeBadge user={contact.assignee} />}
        </span>
      </button>
      <span className="pipeline-card-email">{contact.email}</span>
      {expanded && (
        <div className="pipeline-card-detail">
          {contact.phone && <p>📞 {contact.phone}</p>}
          {contact.company && <p>🏢 {contact.company}</p>}
          <p>{SOURCE_LABEL[contact.source] || contact.source}</p>
          {contact.interest && <p>Interés: {contact.interest}</p>}
          {contact.notes && (
            <p className="pipeline-card-notes">
              {contact.notes.length > 120
                ? `${contact.notes.slice(0, 120)}…`
                : contact.notes}
            </p>
          )}
          <Link href={`/leads/${contact.id}`} className="pipeline-card-link">
            Ver ficha →
          </Link>
        </div>
      )}
      <select
        className="pipeline-card-move"
        value={contact.status}
        disabled={pending}
        onChange={(e) => onMoveSelect(contact.id, e.target.value)}
        aria-label="Mover estado"
        onClick={(e) => e.stopPropagation()}
      >
        {contact.status === "LOST" && (
          <option value="LOST">Perdido</option>
        )}
        {statusOptions.map((s) => (
          <option key={s.id} value={s.id}>
            → {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function PipelineBoard({
  columns: initialColumns,
  lostContacts: initialLost = [],
  allStatuses,
  isStaff: staffView = true,
}) {
  const router = useRouter();
  const [board, setBoard] = useState(() =>
    cloneBoard(initialColumns, initialLost)
  );
  const [expandedId, setExpandedId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const snapshotRef = useRef(null);
  const feedbackTimer = useRef(null);

  useEffect(() => {
    setBoard(cloneBoard(initialColumns, initialLost));
  }, [initialColumns, initialLost]);

  const statusOptions = useMemo(
    () => (allStatuses || initialColumns).filter((s) => s.id !== "LOST"),
    [allStatuses, initialColumns]
  );

  const showFeedback = useCallback((message, type = "error") => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ message, type });
    feedbackTimer.current = setTimeout(() => setFeedback(null), 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const move = useCallback(
    async (contactId, status) => {
      const found = findContact(board, contactId);
      if (!found || found.contact.status === status) return;

      if (status === "LOST") {
        showFeedback(
          "Para marcar como perdido, abre la ficha del lead y elige el motivo.",
          "warn"
        );
        return;
      }

      const snapshot = cloneBoard(board.columns, board.lost);
      snapshotRef.current = snapshot;
      setBoard(applyMove(board, contactId, status));
      setPendingId(contactId);
      setFeedback(null);

      try {
        await updateContactStatus(contactId, status);
        router.refresh();
      } catch (err) {
        setBoard(snapshotRef.current);
        const msg = err?.message || "No se pudo mover el lead.";
        showFeedback(
          msg === "No autorizado"
            ? staffView
              ? "No tienes permiso para mover este lead."
              : "Solo puedes mover leads asignados a ti."
            : msg
        );
      } finally {
        setPendingId(null);
        snapshotRef.current = null;
      }
    },
    [board, router, showFeedback, staffView]
  );

  function onDragStart(e, contactId) {
    setDraggingId(contactId);
    e.dataTransfer.setData("text/contact-id", contactId);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e, colId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverCol(colId);
  }

  async function onDrop(e, colId) {
    e.preventDefault();
    const contactId =
      e.dataTransfer.getData("text/contact-id") || draggingId;
    setDraggingId(null);
    setOverCol(null);
    if (contactId) await move(contactId, colId);
  }

  function renderColumn(col) {
    return (
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
          {col.contacts.map((c) => (
            <PipelineCard
              key={c.id}
              contact={c}
              expanded={expandedId === c.id}
              dragging={draggingId === c.id}
              pending={pendingId === c.id}
              statusOptions={statusOptions}
              onToggle={(id) =>
                setExpandedId(expandedId === id ? null : id)
              }
              onDragStart={onDragStart}
              onDragEnd={() => {
                setDraggingId(null);
                setOverCol(null);
              }}
              onMoveSelect={move}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {feedback && (
        <div
          className={`pipeline-feedback pipeline-feedback--${feedback.type}`}
          role="alert"
        >
          {feedback.message}
          <button
            type="button"
            className="pipeline-feedback-dismiss"
            onClick={() => setFeedback(null)}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      )}
      <div className="pipeline-scroll">
        <div className="pipeline">{board.columns.map(renderColumn)}</div>
      </div>
      {board.lost.length > 0 && (
        <div className="card pipeline-lost">
          <h2>Perdidos ({board.lost.length})</h2>
          <p className="pipeline-lost-hint">
            Arrastra de vuelta al pipeline o usa el selector para reactivar.
          </p>
          <div className="pipeline pipeline-lost-grid">
            <div
              className={`pipeline-col${overCol === "LOST" ? " pipeline-col--over" : ""}`}
              onDragOver={(e) => onDragOver(e, "LOST")}
              onDragLeave={() => setOverCol(null)}
              onDrop={(e) => onDrop(e, "LOST")}
            >
              <h3>
                <span className="pipeline-col-dot" data-status="LOST" />
                Perdido
                <span className="pipeline-col-count">{board.lost.length}</span>
              </h3>
              <div className="pipeline-col-body">
                {board.lost.map((c) => (
                  <PipelineCard
                    key={c.id}
                    contact={c}
                    expanded={expandedId === c.id}
                    dragging={draggingId === c.id}
                    pending={pendingId === c.id}
                    statusOptions={statusOptions}
                    onToggle={(id) =>
                      setExpandedId(expandedId === id ? null : id)
                    }
                    onDragStart={onDragStart}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setOverCol(null);
                    }}
                    onMoveSelect={move}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
