"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toggleTask, updateTask, deleteTask } from "@/app/actions";
import AssigneeBadge from "@/components/AssigneeBadge";
import EmptyState from "@/components/EmptyState";
import { TASK_PRIORITIES } from "@/lib/constants";
import { taskDueStatus, dueLabel } from "@/lib/crm-utils";

function priorityClass(p) {
  if (p === "HIGH") return "priority-high";
  if (p === "LOW") return "priority-low";
  return "priority-medium";
}

function rowDueClass(dueAt, done) {
  const s = taskDueStatus(dueAt, done);
  if (s === "overdue") return "task-due--overdue";
  if (s === "today" || s === "tomorrow") return "task-due--soon";
  return "";
}

function TaskRowContent({ t, isAdmin, team, showContact, onEdit, onRemove }) {
  const due = taskDueStatus(t.dueAt, t.done);
  const badge = dueLabel(due);

  return (
    <>
      <label>
        {t.title}{" "}
        <span className={`priority-pill ${priorityClass(t.priority)}`}>
          {TASK_PRIORITIES.find((p) => p.id === t.priority)?.label || "Media"}
        </span>
        {t.recurDays ? (
          <span className="recur-pill">↻ {t.recurDays}d</span>
        ) : null}
      </label>
      {badge && !t.done && (
        <span className={`due-badge due-badge--${due}`}>{badge}</span>
      )}
      {t.dueAt && (
        <small className={rowDueClass(t.dueAt, t.done)}>
          {new Date(t.dueAt).toLocaleString("es-ES")}
        </small>
      )}
      {t.assignee && <AssigneeBadge user={t.assignee} />}
      {showContact && t.contact && (
        <Link href={`/leads/${t.contactId}`}>{t.contact.name}</Link>
      )}
      <div className="task-actions">
        <button type="button" className="btn-sm btn-ghost" onClick={onEdit}>
          Editar
        </button>
        <button type="button" className="btn-sm btn-danger" onClick={onRemove}>
          Borrar
        </button>
      </div>
    </>
  );
}

export default function TaskList({
  tasks,
  team,
  isAdmin,
  embedded = false,
  showContact = true,
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editPriority, setEditPriority] = useState("MEDIUM");
  const [editRecur, setEditRecur] = useState("");

  function startEdit(t) {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditDue(t.dueAt ? new Date(t.dueAt).toISOString().slice(0, 16) : "");
    setEditAssignee(t.assigneeId || "");
    setEditPriority(t.priority || "MEDIUM");
    setEditRecur(t.recurDays ? String(t.recurDays) : "");
  }

  async function saveEdit(taskId) {
    await updateTask(taskId, {
      title: editTitle,
      dueAt: editDue || null,
      assigneeId: isAdmin ? editAssignee || null : undefined,
      priority: editPriority,
      recurDays: editRecur || null,
    });
    setEditingId(null);
    router.refresh();
  }

  async function remove(taskId) {
    if (!confirm("¿Eliminar esta tarea?")) return;
    await deleteTask(taskId);
    router.refresh();
  }

  return (
    <div className={embedded ? "task-list-inner" : "card task-list-card"}>
      {tasks.map((t) => (
        <div
          key={t.id}
          className={`task-row${t.done ? " task-row--done" : ""} ${rowDueClass(t.dueAt, t.done)}`}
        >
          <input
            type="checkbox"
            checked={t.done}
            onChange={(e) => toggleTask(t.id, e.target.checked)}
          />
          {editingId === t.id ? (
            <div className="task-edit">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="task-edit-input"
              />
              <input
                type="datetime-local"
                value={editDue}
                onChange={(e) => setEditDue(e.target.value)}
                className="task-edit-input"
              />
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="task-edit-input"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                placeholder="Repetir días"
                value={editRecur}
                onChange={(e) => setEditRecur(e.target.value)}
                className="task-edit-input"
              />
              {isAdmin && (
                <select
                  value={editAssignee}
                  onChange={(e) => setEditAssignee(e.target.value)}
                  className="task-edit-input"
                >
                  <option value="">Sin asignar</option>
                  {team.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              )}
              <button type="button" className="btn-sm" onClick={() => saveEdit(t.id)}>
                Guardar
              </button>
              <button
                type="button"
                className="btn-sm btn-ghost"
                onClick={() => setEditingId(null)}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <TaskRowContent
              t={t}
              isAdmin={isAdmin}
              team={team}
              showContact={showContact}
              onEdit={() => startEdit(t)}
              onRemove={() => remove(t.id)}
            />
          )}
        </div>
      ))}
      {!tasks.length && (
        <EmptyState
          icon="tasks"
          title="Sin tareas"
          description={
            isAdmin
              ? "Crea una tarea para organizar el seguimiento comercial."
              : "No tienes tareas asignadas por ahora."
          }
        />
      )}
    </div>
  );
}
