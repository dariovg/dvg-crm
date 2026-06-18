import Link from "next/link";

export default function TaskRemindersBanner({ overdue, dueToday }) {
  if (!overdue && !dueToday) return null;

  return (
    <div className={`reminder-banner${overdue ? " reminder-banner--overdue" : ""}`}>
      {overdue > 0 && (
        <span>
          <strong>{overdue}</strong> tarea{overdue !== 1 ? "s" : ""} vencida
          {overdue !== 1 ? "s" : ""}
        </span>
      )}
      {dueToday > 0 && (
        <span>
          <strong>{dueToday}</strong> vence hoy
        </span>
      )}
      <Link href="/tasks" className="reminder-banner-link">
        Ver tareas →
      </Link>
    </div>
  );
}
