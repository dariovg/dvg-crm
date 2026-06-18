"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions";

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const data = await fetchNotifications();
    setItems(data.items);
    setUnread(data.unread);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  async function onClick(n) {
    if (!n.read) await markNotificationRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
    load();
  }

  async function markAll() {
    await markAllNotificationsRead();
    load();
  }

  return (
    <div className="notif-bell-wrap">
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
      >
        Alertas
        {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <>
          <div className="notif-backdrop" onClick={() => setOpen(false)} />
          <div className="notif-panel">
            <div className="notif-panel-head">
              <strong>Notificaciones</strong>
              {unread > 0 && (
                <button type="button" className="btn-sm btn-ghost" onClick={markAll}>
                  Marcar leídas
                </button>
              )}
            </div>
            <ul className="notif-list">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`notif-item${n.read ? "" : " notif-item--unread"}`}
                    onClick={() => onClick(n)}
                  >
                    <strong>{n.title}</strong>
                    {n.body && <span>{n.body}</span>}
                    <time>{new Date(n.createdAt).toLocaleString("es-ES")}</time>
                  </button>
                </li>
              ))}
            </ul>
            {!items.length && <p className="notif-empty">Sin notificaciones</p>}
          </div>
        </>
      )}
    </div>
  );
}
