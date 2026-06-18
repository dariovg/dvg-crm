"use client";

import { useState } from "react";
import { createTask } from "@/app/actions";

export default function TaskForm({ contactId }) {
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask(contactId, title.trim(), dueAt || null);
    setTitle("");
    setDueAt("");
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
        <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary">
        Crear tarea
      </button>
    </form>
  );
}
