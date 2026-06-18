import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import AssigneeBadge from "@/components/AssigneeBadge";
import ContactEditor from "@/components/ContactEditor";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import { SOURCE_LABEL } from "@/lib/constants";
import { getAuthSession, listTeamUsers } from "@/lib/auth-server";
import { canAccessContact, isAdmin } from "@/lib/permissions";

export default async function LeadDetailPage({ params }) {
  const { id } = await params;
  const session = await getAuthSession();
  const admin = isAdmin(session);

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, email: true, name: true, role: true } },
      events: { orderBy: { createdAt: "desc" }, include: { user: true } },
      meetings: { orderBy: { createdAt: "desc" } },
      tasks: {
        orderBy: { createdAt: "desc" },
        include: {
          assignee: { select: { id: true, email: true, name: true, role: true } },
        },
      },
      surveys: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  if (!contact || !canAccessContact(session, contact)) notFound();

  const team = admin ? await listTeamUsers() : [];

  return (
    <>
      <h1 className="page-title">{contact.name}</h1>
      <p className="page-lead lead-detail-meta">
        <StatusBadge status={contact.status} /> · {SOURCE_LABEL[contact.source]}
        {contact.assignee && (
          <>
            {" "}
            · <AssigneeBadge user={contact.assignee} />
          </>
        )}
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
              <strong>Alta:</strong>{" "}
              {contact.createdAt.toLocaleString("es-ES")}
            </p>
          </div>

          {contact.meetings.length > 0 && (
            <div className="card">
              <h2>Citas</h2>
              <ul className="timeline">
                {contact.meetings.map((m) => (
                  <li key={m.id}>
                    <time>
                      {m.date} · {m.time}
                    </time>
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
                  {ev.user?.name && (
                    <div className="timeline-user">por {ev.user.name}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <ContactEditor contact={contact} team={team} isAdmin={admin} />
          <TaskForm contactId={contact.id} team={team} isAdmin={admin} />
          {contact.tasks.length > 0 && (
            <div className="card task-list-card">
              <h2>Tareas del lead</h2>
              <TaskList
                tasks={contact.tasks}
                team={team}
                isAdmin={admin}
                embedded
                showContact={false}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
