"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTask } from "@/app/actions";
import { TASK_PRIORITIES } from "@/lib/constants";

export default function TaskForm({ contactId, team = [], canAssign = false }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [recurDays, setRecurDays] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask(
      contactId,
      title.trim(),
      dueAt || null,
      canAssign ? assigneeId || null : undefined,
      priority,
      recurDays || null
    );
    setTitle("");
    setDueAt("");
    setAssigneeId("");
    setPriority("MEDIUM");
    setRecurDays("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card">
      <h2>Nueva tarea</h2>
      <div className="field">
        <label>Título</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Llamar en 48h"
        />
      </div>
      <div className="field">
        <label>Prioridad</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {TASK_PRIORITIES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Fecha límite (opcional)</label>
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Repetir cada (días, opcional)</label>
        <input
          type="number"
          min="1"
          placeholder="Ej. 7"
          value={recurDays}
          onChange={(e) => setRecurDays(e.target.value)}
        />
      </div>
      {canAssign && (
        <div className="field">
          <label>Asignar a</label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
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
      <button type="submit" className="btn-primary">
        Crear tarea
      </button>
    </form>
  );
}
