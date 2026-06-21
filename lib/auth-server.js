import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { prisma } from "./prisma";
import { unstable_cache } from "next/cache";

/** Sesión JWT sin round-trip extra a la BD en cada página. */
export const getAuthSession = cache(async () => {
  return getServerSession(authOptions);
});

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
  return listTeamUsersCached();
}

const listTeamUsersCached = unstable_cache(
  async () =>
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: { id: true, email: true, name: true, role: true },
    }),
  ["crm-team-users"],
  { revalidate: 120, tags: ["team-users"] }
);
