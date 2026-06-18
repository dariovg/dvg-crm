import { prisma } from "@/lib/prisma";
import { CONTACT_STATUSES, FUNNEL_STAGES } from "@/lib/constants";
import { getAuthSession, listTeamUsers } from "@/lib/auth-server";
import { contactScope, taskScope, isStaff } from "@/lib/permissions";
import { computeStageDurations, taskDueStatus } from "@/lib/crm-utils";
import DashboardView from "@/components/DashboardView";

export default async function DashboardPage() {
  const session = await getAuthSession();
  const scope = contactScope(session);
  const staff = isStaff(session);
  const taskWhere = { ...taskScope(session), done: false };
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    total,
    byStatus,
    recent,
    pendingTasks,
    unassigned,
    team,
    dealAgg,
    weeklyNew,
    weeklyEvents,
    weeklyTasks,
    teamUsers,
    statusEvents,
    openTasks,
  ] = await Promise.all([
    prisma.contact.count({ where: scope }),
    prisma.contact.groupBy({
      by: ["status"],
      where: scope,
      _count: { _all: true },
    }),
    prisma.contact.findMany({
      where: scope,
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.task.count({ where: taskWhere }),
    staff
      ? prisma.contact.count({ where: { assigneeId: null } })
      : Promise.resolve(0),
    listTeamUsers(),
    prisma.contact.aggregate({
      where: { ...scope, status: { not: "LOST" }, dealValue: { not: null } },
      _sum: { dealValue: true },
    }),
    prisma.contact.count({
      where: { ...scope, createdAt: { gte: weekAgo } },
    }),
    prisma.contactEvent.count({
      where: {
        type: "status_changed",
        createdAt: { gte: weekAgo },
        contact: scope,
      },
    }),
    prisma.task.count({
      where: { done: true, updatedAt: { gte: weekAgo }, ...taskScope(session) },
    }),
    staff
      ? prisma.user.findMany({
          where: { role: { in: ["MEMBER", "MANAGER"] } },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve([]),
    prisma.contactEvent.findMany({
      where: { type: "status_changed", contact: scope },
      orderBy: { createdAt: "asc" },
      include: {
        contact: { select: { status: true, createdAt: true } },
      },
    }),
    prisma.task.findMany({
      where: taskWhere,
      select: { dueAt: true, done: true },
    }),
  ]);

  const counts = Object.fromEntries(
    byStatus.map((b) => [b.status, b._count._all])
  );

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

  const funnel = FUNNEL_STAGES.map((id) => {
    const meta = CONTACT_STATUSES.find((s) => s.id === id);
    return { id, label: meta?.label || id, count: counts[id] || 0 };
  });

  const stageDurations = computeStageDurations(statusEvents);

  let overdue = 0;
  let dueToday = 0;
  for (const t of openTasks) {
    const s = taskDueStatus(t.dueAt, false);
    if (s === "overdue") overdue++;
    if (s === "today") dueToday++;
  }

  const stats = {
    total,
    newCount: counts.NEW || 0,
    meetingCount: counts.MEETING_SCHEDULED || 0,
    wonCount: counts.WON || 0,
    pendingTasks,
    unassigned,
    dealValueTotal: dealAgg._sum.dealValue || 0,
    byStatus: CONTACT_STATUSES.map((s) => ({
      ...s,
      count: counts[s.id] || 0,
    })),
  };

  return (
    <DashboardView
      stats={stats}
      recent={recent}
      isStaff={staff}
      teamCount={team.length}
      memberStats={memberStats}
      funnel={funnel}
      weekly={{
        newLeads: weeklyNew,
        statusChanges: weeklyEvents,
        tasksDone: weeklyTasks,
      }}
      stageDurations={stageDurations}
      taskReminders={{ overdue, dueToday }}
    />
  );
}
