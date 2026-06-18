import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { prisma } from "./prisma";

export async function getAuthSession() {
  return getServerSession(authOptions);
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
