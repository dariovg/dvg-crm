import { prisma } from "./prisma";
import { CONTACT_STATUSES, FUNNEL_STAGES } from "./constants";

/** Dashboard en pocas consultas paralelas (sin joins pesados). */
export async function loadDashboardStats({
  scope,
  qScope,
  taskWhere,
  taskScopeWhere,
  showTasks,
  weekAgo,
  staff,
}) {
  const [
    byStatus,
    recent,
    pendingTasks,
    unassigned,
    teamCount,
    dealAgg,
    weeklyNew,
    weeklyEvents,
    weeklyTasks,
    openQuotes,
    pendingQuotes,
    overdueTasks,
    dueTodayTasks,
  ] = await Promise.all([
    prisma.contact.groupBy({
      by: ["status"],
      where: scope,
      _count: { _all: true },
    }),
    prisma.contact.findMany({
      where: scope,
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.task.count({ where: taskWhere }),
    staff
      ? prisma.contact.count({ where: { assigneeId: null } })
      : Promise.resolve(0),
    prisma.user.count({
      where: { role: { in: ["ADMIN", "MANAGER", "MEMBER", "COMMERCIAL"] } },
    }),
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
    showTasks
      ? prisma.task.count({
          where: { done: true, updatedAt: { gte: weekAgo }, ...taskScopeWhere },
        })
      : Promise.resolve(0),
    prisma.quote.count({
      where: {
        ...qScope,
        status: { in: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT"] },
      },
    }),
    prisma.quote.count({
      where: { ...qScope, status: "PENDING_APPROVAL" },
    }),
    showTasks
      ? prisma.task.count({
          where: {
            ...taskWhere,
            dueAt: { lt: startOfToday() },
          },
        })
      : Promise.resolve(0),
    showTasks
      ? prisma.task.count({
          where: {
            ...taskWhere,
            dueAt: { gte: startOfToday(), lt: startOfTomorrow() },
          },
        })
      : Promise.resolve(0),
  ]);

  const counts = Object.fromEntries(
    byStatus.map((b) => [b.status, b._count._all])
  );
  const total = Object.values(counts).reduce((a, n) => a + n, 0);

  const funnel = FUNNEL_STAGES.map((id) => {
    const meta = CONTACT_STATUSES.find((s) => s.id === id);
    return { id, label: meta?.label || id, count: counts[id] || 0 };
  });

  return {
    stats: {
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
    },
    recent,
    funnel,
    teamCount,
    weekly: {
      newLeads: weeklyNew,
      statusChanges: weeklyEvents,
      tasksDone: weeklyTasks,
    },
    quoteStats: { open: openQuotes, pending: pendingQuotes },
    taskReminders: showTasks
      ? { overdue: overdueTasks, dueToday: dueTodayTasks }
      : null,
  };
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfTomorrow() {
  const d = startOfToday();
  d.setDate(d.getDate() + 1);
  return d;
}
