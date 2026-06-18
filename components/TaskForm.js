"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTask } from "@/app/actions";

export default function TaskForm({ contactId, team = [], isAdmin = false }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask(
      contactId,
      title.trim(),
      dueAt || null,
      isAdmin ? assigneeId || null : undefined
    );
    setTitle("");
    setDueAt("");
    setAssigneeId("");
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
        <label>Fecha límite (opcional)</label>
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
        />
      </div>
      {isAdmin && (
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
