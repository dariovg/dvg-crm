"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

function roleLabel(role) {
  if (role === "ADMIN") return "Administración";
  if (role === "MANAGER") return "Manager";
  if (role === "MARKETING") return "Marketing";
  return "Equipo";
}

function initials(name, email) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (!session?.user) return null;

  const { name, email, role } = session.user;
  const display = name || email;

  function handleSignOut() {
    setOpen(false);
    signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="user-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={display}
      >
        <span className="user-menu-avatar" aria-hidden>
          {initials(name, email)}
        </span>
        <span className="user-menu-label">{display}</span>
      </button>
      {open && (
        <>
          <div className="user-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="user-menu-panel" role="menu">
            <div className="user-menu-head">
              <strong>{display}</strong>
              {email && name && <span>{email}</span>}
              <span className={`role-badge user-menu-role${role === "ADMIN" ? " role-badge--admin" : role === "MANAGER" ? " role-badge--manager" : role === "MARKETING" ? " role-badge--marketing" : ""}`}>
                {roleLabel(role)}
              </span>
            </div>
            <button
              type="button"
              className="user-menu-signout"
              role="menuitem"
              onClick={handleSignOut}
            >
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}
