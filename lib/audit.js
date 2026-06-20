import { prisma } from "./prisma";

/**
 * @param {{
 *   userId?: string | null,
 *   action: string,
 *   summary: string,
 *   entityType?: string | null,
 *   entityId?: string | null,
 *   payload?: Record<string, unknown> | null,
 *   ipHash?: string | null,
 * }} input
 */
export async function recordAudit(input) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId || null,
        action: input.action,
        summary: input.summary,
        entityType: input.entityType || null,
        entityId: input.entityId || null,
        payload: input.payload || undefined,
        ipHash: input.ipHash || null,
      },
    });
  } catch (err) {
    console.error("[audit]", input.action, err.message);
  }
}

export async function listAuditLogs({ limit = 100, action, userId } = {}) {
  const where = {};
  if (action) where.action = action;
  if (userId) where.userId = userId;

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}
