"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toggleTask, updateTask, deleteTask } from "@/app/actions";
import AssigneeBadge from "@/components/AssigneeBadge";

import { TASK_PRIORITIES } from "@/lib/constants";

function priorityClass(p) {
  if (p === "HIGH") return "priority-high";
  if (p === "LOW") return "priority-low";
  return "priority-medium";
}

function dueClass(dueAt, done) {
  if (done || !dueAt) return "";
  const d = new Date(dueAt);
  const now = new Date();
  if (d < now) return "task-due--overdue";
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d <= tomorrow) return "task-due--soon";
  return "";
}

export default function TaskList({ tasks, team, isAdmin, embedded = false, showContact = true }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editPriority, setEditPriority] = useState("MEDIUM");

  function startEdit(t) {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditDue(t.dueAt ? new Date(t.dueAt).toISOString().slice(0, 16) : "");
    setEditAssignee(t.assigneeId || "");
    setEditPriority(t.priority || "MEDIUM");
  }

  async function saveEdit(taskId) {
    await updateTask(taskId, {
      title: editTitle,
      dueAt: editDue || null,
      assigneeId: isAdmin ? editAssignee || null : undefined,
      priority: editPriority,
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
        <div key={t.id} className={`task-row${t.done ? " task-row--done" : ""} ${dueClass(t.dueAt, t.done)}`}>
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
              <button type="button" className="btn-sm btn-ghost" onClick={() => setEditingId(null)}>
                Cancelar
              </button>
            </div>
          ) : (
            <>
              <label>
                {t.title}{" "}
                <span className={`priority-pill ${priorityClass(t.priority)}`}>
                  {TASK_PRIORITIES.find((p) => p.id === t.priority)?.label || "Media"}
                </span>
              </label>
              {t.dueAt && (
                <small className={dueClass(t.dueAt, t.done)}>
                  {new Date(t.dueAt).toLocaleString("es-ES")}
                </small>
              )}
              {t.assignee && <AssigneeBadge user={t.assignee} />}
              {showContact && t.contact && (
                <Link href={`/leads/${t.contactId}`}>{t.contact.name}</Link>
              )}
              <div className="task-actions">
                <button type="button" className="btn-sm btn-ghost" onClick={() => startEdit(t)}>
                  Editar
                </button>
                <button type="button" className="btn-sm btn-danger" onClick={() => remove(t.id)}>
                  Borrar
                </button>
              </div>
            </>
          )}
        </div>
      ))}
      {!tasks.length && (
        <p className="empty-state">Sin tareas {isAdmin ? "" : "asignadas a ti"}.</p>
      )}
    </div>
  );
}
