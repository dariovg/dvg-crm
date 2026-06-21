import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import AssigneeBadge from "@/components/AssigneeBadge";
import ContactQuickActions from "@/components/ContactQuickActions";
import LeadScoreBadge from "@/components/LeadScoreBadge";
import ContactEditor from "@/components/ContactEditor";
import ContactQuotes from "@/components/ContactQuotes";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import LeadTimeline from "@/components/LeadTimeline";
import { SOURCE_LABEL } from "@/lib/constants";
import { getAuthSession, listTeamUsers } from "@/lib/auth-server";
import { canAccessContact, canAssignContacts, canDeleteContact, isAdmin, isStaff } from "@/lib/permissions";
import { isMailConfigured } from "@/lib/mail";
import { getScoringRules } from "@/lib/crm-settings";
import { computeLeadScore } from "@/lib/lead-score";

export default async function LeadDetailPage({ params }) {
  const { id } = await params;
  const session = await getAuthSession();
  const canAssign = canAssignContacts(session);
  const canDelete = canDeleteContact(session);
  const staff = isStaff(session);

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, email: true, name: true, role: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      events: { orderBy: { createdAt: "desc" }, include: { user: true } },
      meetings: { orderBy: { createdAt: "desc" } },
      tasks: {
        orderBy: { createdAt: "desc" },
        include: {
          assignee: { select: { id: true, email: true, name: true, role: true } },
        },
      },
      surveys: { orderBy: { createdAt: "desc" } },
      quotes: {
        orderBy: { createdAt: "desc" },
        include: {
          contact: { select: { id: true, name: true } },
          lines: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!contact || !canAccessContact(session, contact)) notFound();

  const scoringRules = await getScoringRules();
  const leadScore = computeLeadScore(contact, scoringRules);
  const mailEnabled = isMailConfigured();

  const team = canAssign ? await listTeamUsers() : [];

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
        {leadScore != null && (
          <>
            {" "}
            · <LeadScoreBadge score={leadScore} />
          </>
        )}
      </p>

      <ContactQuickActions contact={contact} mailEnabled={mailEnabled} />

      <div className="detail-grid">
        <div>
          <div className="card card-muted">
            <h2>Resumen</h2>
            <p>
              <strong>Origen:</strong> {SOURCE_LABEL[contact.source]}
            </p>
            <p>
              <strong>Alta:</strong>{" "}
              {contact.createdAt.toLocaleString("es-ES")}
            </p>
            {contact.tags?.length > 0 && (
              <p>
                <strong>Etiquetas:</strong>{" "}
                {contact.tags.map((t) => (
                  <span key={t} className="tag-chip">
                    {t}
                  </span>
                ))}
              </p>
            )}
            <p className="muted contact-edit-hint">
              Edita nombre, email, teléfono y empresa en el panel derecho.
            </p>
          </div>

          <ContactQuotes
            contactId={contact.id}
            quotes={contact.quotes}
            isAdmin={isAdmin(session)}
            canDelete={canDelete}
          />

          <div className="card">
            <h2>Línea de tiempo</h2>
            <LeadTimeline contact={contact} />
          </div>
        </div>

        <div>
          <ContactEditor
            contact={contact}
            team={team}
            canAssign={canAssign}
            canDelete={canDelete}
          />
          <TaskForm contactId={contact.id} team={team} canAssign={canAssign} />
          {contact.tasks.length > 0 && (
            <div className="card task-list-card">
              <h2>Tareas del lead</h2>
              <TaskList
                tasks={contact.tasks}
                team={team}
                isAdmin={staff}
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
