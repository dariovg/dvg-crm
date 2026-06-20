import { notFound } from "next/navigation";
import { listAuditLogs } from "@/lib/audit";
import { getAuthSession } from "@/lib/auth-server";
import { canManageUsers } from "@/lib/permissions";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function formatWhen(date) {
  return format(new Date(date), "d MMM yyyy, HH:mm", { locale: es });
}

export default async function AdminAuditPage() {
  const session = await getAuthSession();
  if (!canManageUsers(session)) notFound();

  const logs = await listAuditLogs({ limit: 150 });

  return (
    <>
      <h1 className="page-title">Auditoría</h1>
      <p className="page-lead">
        Registro de acciones relevantes: accesos, cambios de rol, presupuestos y
        seguridad.
      </p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{formatWhen(log.createdAt)}</td>
                <td>{log.user?.name || log.user?.email || "Sistema"}</td>
                <td>
                  <code>{log.action}</code>
                </td>
                <td>{log.summary}</td>
              </tr>
            ))}
            {!logs.length && (
              <tr>
                <td colSpan={4}>Sin registros todavía.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
