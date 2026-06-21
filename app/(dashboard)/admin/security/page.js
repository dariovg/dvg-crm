import { notFound } from "next/navigation";
import { getAuthSession } from "@/lib/auth-server";
import { canManageUsers } from "@/lib/permissions";
import { listActiveSessions } from "@/lib/session-tracker";
import ActiveSessionsAdmin from "@/components/ActiveSessionsAdmin";

export default async function AdminSecurityPage() {
  const session = await getAuthSession();
  if (!canManageUsers(session)) notFound();

  const sessions = await listActiveSessions();

  return (
    <>
      <h1 className="page-title">Seguridad</h1>
      <p className="page-lead">
        Sesiones activas y cierre remoto de dispositivos conectados a la app.
      </p>
      <ActiveSessionsAdmin
        sessions={sessions}
        currentSessionId={session.user.sessionId}
        currentUserId={session.user.id}
      />
    </>
  );
}
