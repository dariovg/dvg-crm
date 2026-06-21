import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CONTACT_STATUSES, FUNNEL_STAGES } from "@/lib/constants";
import { getAuthSession, listTeamUsers } from "@/lib/auth-server";
import {
  contactScope,
  taskScope,
  isStaff,
  quoteScope,
  canAccessTasksCalendar,
  isCommercial,
} from "@/lib/permissions";
import { taskDueStatus } from "@/lib/crm-utils";
import { getCrmSettings } from "@/lib/crm-settings";
import { withLeadScores } from "@/lib/lead-score";
import DashboardView from "@/components/DashboardView";
import { DashboardExtra } from "@/components/DashboardExtra";
import DashboardExtraSkeleton from "@/components/DashboardExtraSkeleton";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function DashboardPage() {
  const session = await getAuthSession();
  const scope = contactScope(session);
  const staff = isStaff(session);
  const showTasks = canAccessTasksCalendar(session);
  const commercial = isCommercial(session);
  const taskWhere = showTasks ? { ...taskScope(session), done: false } : { id: "__none__" };
  const qScope = quoteScope(session);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { inactivityDays, scoringRules } = await getCrmSettings();

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
    openTasks,
    openQuotes,
    pendingQuotes,
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
      where: showTasks
        ? { done: true, updatedAt: { gte: weekAgo }, ...taskScope(session) }
        : { id: "__none__" },
    }),
    prisma.task.findMany({
      where: taskWhere,
      select: { dueAt: true, done: true },
      take: 200,
    }),
    prisma.quote.count({
      where: {
        ...qScope,
        status: { in: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT"] },
      },
    }),
    prisma.quote.count({
      where: { ...qScope, status: "PENDING_APPROVAL" },
    }),
  ]);

  const counts = Object.fromEntries(
    byStatus.map((b) => [b.status, b._count._all])
  );

  const funnel = FUNNEL_STAGES.map((id) => {
    const meta = CONTACT_STATUSES.find((s) => s.id === id);
    return { id, label: meta?.label || id, count: counts[id] || 0 };
  });

  let overdue = 0;
  let dueToday = 0;
  for (const t of openTasks) {
    const s = taskDueStatus(t.dueAt, false);
    if (s === "overdue") overdue++;
    if (s === "today") dueToday++;
  }

  const recentWithScores = withLeadScores(recent, scoringRules);

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
    <div className="page-pad dash-page">
      <DashboardView
        stats={stats}
        recent={recentWithScores}
        isStaff={staff}
        showTasks={showTasks}
        isCommercial={commercial}
        teamCount={team.length}
        weekly={{
          newLeads: weeklyNew,
          statusChanges: weeklyEvents,
          tasksDone: weeklyTasks,
        }}
        quoteStats={{ open: openQuotes, pending: pendingQuotes }}
        taskReminders={showTasks ? { overdue, dueToday } : null}
      />
      <Suspense fallback={<DashboardExtraSkeleton />}>
        <DashboardExtra
          session={session}
          inactivityDays={inactivityDays}
          statsTotal={stats.total}
          funnel={funnel}
          statsByStatus={stats.byStatus}
        />
      </Suspense>
    </div>
  );
}
