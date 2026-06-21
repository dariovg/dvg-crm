import { prisma } from "./prisma.js";
import { getMarketingDashboardStats } from "./marketing-stats.js";

export async function getCeoDashboardStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    marketing,
    totalLeads,
    newLeadsWeek,
    wonLeads,
    pipelineValue,
    openQuotes,
    pendingQuotes,
    acceptedQuotesMonth,
    leadsByStatus,
    topAssignees,
  ] = await Promise.all([
    getMarketingDashboardStats({ includeLeads: true }),
    prisma.contact.count(),
    prisma.contact.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.contact.count({ where: { status: "WON" } }),
    prisma.contact.aggregate({
      where: { status: { notIn: ["LOST", "WON"] }, dealValue: { not: null } },
      _sum: { dealValue: true },
    }),
    prisma.quote.count({
      where: { status: { in: ["DRAFT", "APPROVED", "SENT"] } },
    }),
    prisma.quote.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.quote.count({
      where: { status: "ACCEPTED", updatedAt: { gte: monthAgo } },
    }),
    prisma.contact.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.contact.groupBy({
      by: ["assigneeId"],
      where: { assigneeId: { not: null }, status: { not: "LOST" } },
      _count: { _all: true },
    }),
  ]);

  const assigneeIds = topAssignees
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 5)
    .map((r) => r.assigneeId)
    .filter(Boolean);
  const assigneeUsers = assigneeIds.length
    ? await prisma.user.findMany({
        where: { id: { in: assigneeIds } },
        select: { id: true, name: true, email: true, role: true },
      })
    : [];

  const assigneeMap = Object.fromEntries(assigneeUsers.map((u) => [u.id, u]));

  return {
    marketing,
    sales: {
      totalLeads,
      newLeadsWeek,
      wonLeads,
      pipelineValue: pipelineValue._sum.dealValue || 0,
      openQuotes,
      pendingQuotes,
      acceptedQuotesMonth,
      leadsByStatus: leadsByStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
      topAssignees: topAssignees
        .sort((a, b) => b._count._all - a._count._all)
        .slice(0, 5)
        .map((r) => ({
        user: assigneeMap[r.assigneeId] || null,
        count: r._count._all,
      })),
    },
  };
}
