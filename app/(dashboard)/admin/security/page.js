import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-server";
import { canManageUsers } from "@/lib/permissions";
import { listActiveSessions } from "@/lib/session-tracker";
import TwoFactorSetup from "@/components/TwoFactorSetup";
import ActiveSessionsAdmin from "@/components/ActiveSessionsAdmin";

export default async function AdminSecurityPage({ searchParams }) {
  const session = await getAuthSession();
  if (!canManageUsers(session)) notFound();

  const params = await searchParams;
  const setupRequired = params?.setup === "2fa";

  let totpEnabled = false;
  if (session.user.id && session.user.id !== "env-admin") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totpEnabled: true },
    });
    totpEnabled = user?.totpEnabled ?? false;
  }

  const sessions = await listActiveSessions();

  return (
    <>
      <h1 className="page-title">Seguridad</h1>
      <p className="page-lead">
        Autenticación en dos pasos obligatoria para administradores, sesiones activas
        y cierre remoto.
      </p>
      {setupRequired && !totpEnabled && (
        <p className="alert-warning">
          Configura 2FA para continuar usando el CRM como administrador.
        </p>
      )}
      <TwoFactorSetup enabled={totpEnabled} mandatory />
      <ActiveSessionsAdmin
        sessions={sessions}
        currentSessionId={session.user.sessionId}
        currentUserId={session.user.id}
      />
    </>
  );
}
