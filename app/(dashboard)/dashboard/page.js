import { prisma } from "@/lib/prisma";
import { CONTACT_STATUSES } from "@/lib/constants";
import { getAuthSession, listTeamUsers } from "@/lib/auth-server";
import { contactScope, taskScope, isAdmin } from "@/lib/permissions";
import DashboardView from "@/components/DashboardView";

export default async function DashboardPage() {
  const session = await getAuthSession();
  const scope = contactScope(session);
  const admin = isAdmin(session);
  const taskWhere = { ...taskScope(session), done: false };

  const [total, byStatus, recent, pendingTasks, unassigned, team] =
    await Promise.all([
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
      admin
        ? prisma.contact.count({ where: { assigneeId: null } })
        : Promise.resolve(0),
      listTeamUsers(),
    ]);

  const counts = Object.fromEntries(
    byStatus.map((b) => [b.status, b._count._all])
  );

  const stats = {
    total,
    newCount: counts.NEW || 0,
    meetingCount: counts.MEETING_SCHEDULED || 0,
    wonCount: counts.WON || 0,
    pendingTasks,
    unassigned,
    byStatus: CONTACT_STATUSES.map((s) => ({
      ...s,
      count: counts[s.id] || 0,
    })),
  };

  return (
    <DashboardView
      stats={stats}
      recent={recent}
      isAdmin={admin}
      teamCount={team.length}
    />
  );
}
