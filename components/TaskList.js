"use client";

import Link from "next/link";
import { toggleTask } from "@/app/actions";

export default function TaskList({ tasks }) {
  return (
    <div className="card">
      {tasks.map((t) => (
        <div key={t.id} className="task-row">
          <input
            type="checkbox"
            checked={t.done}
            onChange={(e) => toggleTask(t.id, e.target.checked)}
          />
          <label style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.title}</label>
          {t.dueAt && <small>{new Date(t.dueAt).toLocaleString("es-ES")}</small>}
          <Link href={`/leads/${t.contactId}`}>{t.contact.name}</Link>
        </div>
      ))}
      {!tasks.length && <p style={{ color: "#8b93a8", margin: 0 }}>Sin tareas pendientes.</p>}
    </div>
  );
}
