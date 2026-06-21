import { prisma } from "@/lib/prisma";
import { contactScope, isStaff, canAccessTasksCalendar } from "@/lib/permissions";
import { computeStageDurations } from "@/lib/crm-utils";
import { buildActivityFeed } from "@/lib/lead-timeline";
import { getInactiveLeads } from "@/lib/inactivity";
import RecentActivityFeed from "@/components/RecentActivityFeed";
import Accordion from "@/components/Accordion";
import InactivityBanner from "@/components/InactivityBanner";

export async function DashboardExtra({
  session,
  inactivityDays,
  statsTotal,
  funnel,
  statsByStatus,
}) {
  const scope = contactScope(session);
  const staff = isStaff(session);
  const showTasks = canAccessTasksCalendar(session);

  const [activityContacts, statusEvents, inactiveLeads, teamUsers] =
    await Promise.all([
      prisma.contact.findMany({
        where: scope,
        orderBy: { updatedAt: "desc" },
        take: 12,
        include: {
          createdBy: { select: { name: true } },
          events: {
            orderBy: { createdAt: "desc" },
            take: 4,
            include: { user: { select: { name: true } } },
          },
          meetings: { orderBy: { createdAt: "desc" }, take: 1 },
          tasks: {
            orderBy: { createdAt: "desc" },
            take: 2,
            include: { assignee: { select: { name: true } } },
          },
          surveys: { orderBy: { createdAt: "desc" }, take: 1 },
          quotes: {
            orderBy: { createdAt: "desc" },
            take: 2,
            select: { id: true, number: true, createdAt: true },
          },
        },
      }),
      prisma.contactEvent.findMany({
        where: {
          type: "status_changed",
          contact: scope,
          createdAt: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: "asc" },
        take: 2000,
        include: {
          contact: { select: { status: true, createdAt: true } },
        },
      }),
      getInactiveLeads(prisma, scope, inactivityDays),
      staff
        ? prisma.user.findMany({
            where: { role: { in: ["MEMBER", "MANAGER"] } },
            select: { id: true, name: true, email: true },
          })
        : Promise.resolve([]),
    ]);

  const memberStats = staff
    ? await Promise.all(
        teamUsers.map(async (u) => {
          const [assigned, won, pendingTasksMember] = await Promise.all([
            prisma.contact.count({ where: { assigneeId: u.id } }),
            prisma.contact.count({
              where: { assigneeId: u.id, status: "WON" },
            }),
            prisma.task.count({
              where: { assigneeId: u.id, done: false },
            }),
          ]);
          return {
            id: u.id,
            name: u.name || u.email.split("@")[0],
            assigned,
            won,
            pendingTasks: pendingTasksMember,
          };
        })
      )
    : [];

  const recentActivity = buildActivityFeed(activityContacts, 4).slice(0, 12);
  const stageDurations = computeStageDurations(statusEvents);
  const maxPipeline = Math.max(...statsByStatus.map((s) => s.count), 1);
  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);
  const maxStage = Math.max(...(stageDurations || []).map((s) => s.avgDays), 1);

  return (
    <>
      {inactiveLeads?.length > 0 && (
        <InactivityBanner leads={inactiveLeads} thresholdDays={inactivityDays} />
      )}

      <div className="panel dash-activity dash-activity--full">
        <h2 className="panel-title">Actividad reciente</h2>
        <RecentActivityFeed items={recentActivity} />
      </div>

      <Accordion
        title="Embudo y pipeline"
        subtitle="Conversión y distribución por estado"
        badge={statsTotal}
      >
        <div className="dash-grid">
          <div className="dash-pipeline-chart">
            <h3 className="dash-subtitle">Embudo de conversión</h3>
            <ul className="funnel-list">
              {funnel.map((f, i) => {
                const prev = i > 0 ? funnel[i - 1].count : null;
                const rate =
                  prev && prev > 0 ? Math.round((f.count / prev) * 100) : null;
                return (
                  <li key={f.id} className="funnel-step">
                    <span className="funnel-label">{f.label}</span>
                    <div className="funnel-bar-track">
                      <div
                        className="funnel-bar-fill"
                        data-status={f.id}
                        style={{ width: `${(f.count / maxFunnel) * 100}%` }}
                      />
                    </div>
                    <span className="funnel-num">{f.count}</span>
                    {rate != null && <span className="funnel-rate">{rate}%</span>}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="dash-pipeline-chart">
            <h3 className="dash-subtitle">Pipeline</h3>
            <ul className="pipeline-bars">
              {statsByStatus
                .filter((s) => s.id !== "LOST")
                .map((s) => (
                  <li key={s.id}>
                    <span className="pipeline-bars-label">{s.label}</span>
                    <div className="pipeline-bars-track">
                      <div
                        className="pipeline-bars-fill"
                        data-status={s.id}
                        style={{ width: `${(s.count / maxPipeline) * 100}%` }}
                      />
                    </div>
                    <span className="pipeline-bars-num">{s.count}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </Accordion>

      {stageDurations?.length > 0 && (
        <Accordion title="Tiempos por etapa" subtitle="Media de días en cada fase">
          <ul className="pipeline-bars">
            {stageDurations.map((s) => (
              <li key={s.id}>
                <span className="pipeline-bars-label">{s.label}</span>
                <div className="pipeline-bars-track">
                  <div
                    className="pipeline-bars-fill"
                    data-status={s.id}
                    style={{ width: `${(s.avgDays / maxStage) * 100}%` }}
                  />
                </div>
                <span className="pipeline-bars-num">{s.avgDays} d</span>
              </li>
            ))}
          </ul>
        </Accordion>
      )}

      {staff && memberStats?.length > 0 && (
        <Accordion
          title="Equipo"
          subtitle="Rendimiento por miembro"
          badge={memberStats.length}
        >
          <div className="member-stats-grid">
            {memberStats.map((m) => (
              <div key={m.id} className="member-stat">
                <strong>{m.name}</strong>
                <span>{m.assigned} asignados</span>
                <span>{m.won} clientes</span>
                {showTasks && <span>{m.pendingTasks} tareas</span>}
              </div>
            ))}
          </div>
        </Accordion>
      )}
    </>
  );
}
