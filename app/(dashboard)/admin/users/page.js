import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-server";
import { canManageUsers } from "@/lib/permissions";
import { notFound } from "next/navigation";
import TeamUsersAdmin from "@/components/TeamUsersAdmin";

export default async function AdminUsersPage() {
  const session = await getAuthSession();
  if (!canManageUsers(session)) notFound();

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  return (
    <>
      <h1 className="page-title">Equipo</h1>
      <p className="page-lead">
        Gestiona cuentas de la app. Admin ve todo; manager opera leads; equipo solo
        lo asignado.
      </p>
      <TeamUsersAdmin users={users} />
    </>
  );
}
