import { prisma } from "./prisma";

/**
 * @param {{ userId: string, userAgent?: string | null, ipHash?: string | null }} input
 */
export async function createUserSession({ userId, userAgent, ipHash }) {
  return prisma.userSession.create({
    data: {
      userId,
      userAgent: userAgent?.slice(0, 512) || null,
      ipHash: ipHash || null,
    },
  });
}

export async function touchUserSession(sessionId) {
  if (!sessionId) return;
  try {
    await prisma.userSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { lastSeenAt: new Date() },
    });
  } catch {
    /* ignore stale session ids */
  }
}

/**
 * @param {{ sessionId?: string | null, userId?: string | null, tokenVersion?: number | null }} token
 */
export async function isSessionValid(token) {
  if (!token?.userId || token.userId === "env-admin") {
    if (process.env.NODE_ENV === "production" && token?.userId === "env-admin") {
      return false;
    }
    return !!token?.userId;
  }

  const user = await prisma.user.findUnique({
    where: { id: token.userId },
    select: { tokenVersion: true },
  });
  if (!user) return false;
  if (
    token.tokenVersion != null &&
    user.tokenVersion !== token.tokenVersion
  ) {
    return false;
  }

  if (!token.sessionId) return true;

  const session = await prisma.userSession.findUnique({
    where: { id: token.sessionId },
    select: { revokedAt: true, userId: true },
  });
  if (!session || session.revokedAt) return false;
  if (session.userId !== token.userId) return false;

  return true;
}

export async function listActiveSessions({ userId } = {}) {
  const where = { revokedAt: null };
  if (userId) where.userId = userId;

  return prisma.userSession.findMany({
    where,
    orderBy: { lastSeenAt: "desc" },
    take: 50,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
}

export async function revokeSession(sessionId, actorUserId) {
  const session = await prisma.userSession.findUnique({ where: { id: sessionId } });
  if (!session || session.revokedAt) return null;

  const updated = await prisma.userSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  return { session: updated, actorUserId };
}

export async function revokeAllUserSessions(userId, exceptSessionId) {
  const result = await prisma.userSession.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: { revokedAt: new Date() },
  });

  if (!exceptSessionId) {
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  return result.count;
}
