import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { prisma } from "./prisma";
import { isSessionValid } from "./session-tracker";

export async function getAuthSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return session;

  const valid = await isSessionValid({
    userId: session.user.id,
    sessionId: session.user.sessionId,
    tokenVersion: session.user.tokenVersion,
  });

  if (!valid) return null;
  return session;
}

export async function requireAuthSession() {
  const session = await getAuthSession();
  if (!session?.user?.id) throw new Error("No autorizado");
  return session;
}

export async function requireAdminSession() {
  const session = await requireAuthSession();
  if (session.user.role !== "ADMIN") throw new Error("Solo administración");
  return session;
}

export async function requireStaffSession() {
  const session = await requireAuthSession();
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    throw new Error("No autorizado");
  }
  return session;
}

export async function listTeamUsers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, email: true, name: true, role: true },
  });
}
