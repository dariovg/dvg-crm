import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-server";
import { canManageUsers } from "@/lib/permissions";
import TwoFactorSetup from "@/components/TwoFactorSetup";

export default async function AdminSecurityPage() {
  const session = await getAuthSession();
  if (!canManageUsers(session)) notFound();

  let totpEnabled = false;
  if (session.user.id && session.user.id !== "env-admin") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totpEnabled: true },
    });
    totpEnabled = user?.totpEnabled ?? false;
  }

  return (
    <>
      <h1 className="page-title">Seguridad</h1>
      <p className="page-lead">Autenticación en dos pasos para administración.</p>
      <TwoFactorSetup enabled={totpEnabled} />
    </>
  );
}
