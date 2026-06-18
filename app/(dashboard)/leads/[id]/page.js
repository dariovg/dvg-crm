import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import ContactEditor from "@/components/ContactEditor";
import TaskForm from "@/components/TaskForm";
import { SOURCE_LABEL } from "@/lib/constants";

export default async function LeadDetailPage({ params }) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      events: { orderBy: { createdAt: "desc" }, include: { user: true } },
      meetings: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      surveys: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  if (!contact) notFound();

  return (
    <>
      <h1 className="page-title">{contact.name}</h1>
      <p className="page-lead">
        <StatusBadge status={contact.status} /> · {SOURCE_LABEL[contact.source]}
      </p>

      <div className="detail-grid">
        <div>
          <div className="card">
            <h2>Datos de contacto</h2>
            <p>
              <strong>Email:</strong> {contact.email}
            </p>
            <p>
              <strong>Empresa:</strong> {contact.company || "—"}
            </p>
            <p>
              <strong>Teléfono:</strong> {contact.phone || "—"}
            </p>
            <p>
              <strong>Interés:</strong> {contact.interest || "—"}
            </p>
            <p>
              <strong>Alta:</strong> {contact.createdAt.toLocaleString("es-ES")}
            </p>
          </div>

          {contact.meetings.length > 0 && (
            <div className="card">
              <h2>Citas</h2>
              <ul className="timeline">
                {contact.meetings.map((m) => (
                  <li key={m.id}>
                    <time>{m.date} · {m.time}</time>
                    {m.meetUrl && (
                      <a href={m.meetUrl} target="_blank" rel="noreferrer">
                        Google Meet
                      </a>
                    )}
                    {m.notes && <div>{m.notes}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <h2>Historial</h2>
            <ul className="timeline">
              {contact.events.map((ev) => (
                <li key={ev.id}>
                  <time>{ev.createdAt.toLocaleString("es-ES")}</time>
                  {ev.summary}
                  {ev.user?.name && <div style={{ fontSize: ".78rem", color: "#8b93a8" }}>por {ev.user.name}</div>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <ContactEditor contact={contact} />
          <TaskForm contactId={contact.id} />
          {contact.tasks.length > 0 && (
            <div className="card">
              <h2>Tareas</h2>
              {contact.tasks.map((t) => (
                <div key={t.id} className="task-row">
                  <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
