"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { revokeActiveSession, revokeAllSessions } from "@/app/actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

function formatWhen(date) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
  } catch {
    return "—";
  }
}

export default function ActiveSessionsAdmin({
  sessions,
  currentSessionId,
  currentUserId,
}) {
  const router = useRouter();
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");

  async function onRevoke(sessionId) {
    setPending(sessionId);
    setError("");
    try {
      await revokeActiveSession(sessionId);
      router.refresh();
    } catch (err) {
      setError(err.message || "No se pudo cerrar la sesión");
    }
    setPending(null);
  }

  async function onRevokeAll(userId, keepCurrent) {
    if (!confirm("¿Cerrar todas las sesiones seleccionadas?")) return;
    setPending(`all-${userId}`);
    setError("");
    try {
      await revokeAllSessions(userId, keepCurrent);
      router.refresh();
    } catch (err) {
      setError(err.message || "No se pudieron cerrar las sesiones");
    }
    setPending(null);
  }

  const grouped = sessions.reduce((acc, s) => {
    const key = s.userId;
    if (!acc[key]) acc[key] = { user: s.user, items: [] };
    acc[key].items.push(s);
    return acc;
  }, {});

  return (
    <div className="card">
      <h2>Sesiones activas</h2>
      <p className="page-lead">
        Cierra sesiones remotamente. Con JWT, la invalidación completa puede tardar
        hasta la expiración del token (~8 h) en navegación ya cargada; las acciones
        del servidor quedan bloqueadas de inmediato.
      </p>
      {error && <p className="form-error">{error}</p>}
      {!sessions.length ? (
        <p>No hay sesiones activas registradas.</p>
      ) : (
        Object.values(grouped).map(({ user, items }) => (
          <div key={user.id} className="session-group">
            <div className="session-group-head">
              <strong>{user.name || user.email}</strong>
              <span className="role-pill">{user.role}</span>
              <button
                type="button"
                className="btn-sm"
                disabled={!!pending}
                onClick={() => onRevokeAll(user.id, user.id === currentUserId)}
              >
                Cerrar todas
              </button>
            </div>
            <ul className="session-list">
              {items.map((s) => (
                <li key={s.id}>
                  <div>
                    <p>{s.userAgent || "Navegador desconocido"}</p>
                    <p className="muted">
                      Inicio {formatWhen(s.createdAt)} · Última actividad{" "}
                      {formatWhen(s.lastSeenAt)}
                      {s.id === currentSessionId ? " · Sesión actual" : ""}
                    </p>
                  </div>
                  {s.id !== currentSessionId && (
                    <button
                      type="button"
                      className="btn-sm btn-danger"
                      disabled={pending === s.id}
                      onClick={() => onRevoke(s.id)}
                    >
                      Cerrar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
