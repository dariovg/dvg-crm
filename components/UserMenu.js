"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import UserAvatar from "@/components/UserAvatar";
import { presenceLabel } from "@/lib/user-presence";

function roleLabel(role, t) {
  if (role === "ADMIN") return t("role.admin");
  if (role === "MANAGER") return t("role.manager");
  if (role === "MARKETING") return t("role.marketing");
  if (role === "FINANCE") return t("role.finance");
  if (role === "COMMERCIAL") return t("role.commercial");
  if (role === "ADMINISTRATION") return t("role.administration");
  return t("role.member");
}

export default function UserMenu() {
  const { data: session } = useSession();
  const { locale, t } = useLocale();
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

  const { name, email, role, image, profileStatus, statusMessage } = session.user;
  const display = name || email;
  const presence =
    profileStatus && profileStatus !== "AVAILABLE"
      ? presenceLabel(profileStatus, locale)
      : null;

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
        <UserAvatar
          name={name}
          email={email}
          image={image}
          profileStatus={profileStatus}
          size={28}
          showStatus
          locale={locale}
          className="user-menu-avatar-component"
        />
        <span className="user-menu-label">{display}</span>
      </button>
      {open && (
        <>
          <div className="user-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="user-menu-panel" role="menu">
            <div className="user-menu-head">
              <UserAvatar
                name={name}
                email={email}
                image={image}
                profileStatus={profileStatus}
                size={44}
                showStatus
                locale={locale}
              />
              <strong>{display}</strong>
              {email && name && <span>{email}</span>}
              {presence && (
                <span className={`presence-pill presence-pill--${profileStatus.toLowerCase()}`}>
                  {presence}
                </span>
              )}
              {statusMessage && (
                <span className="user-menu-status-msg">{statusMessage}</span>
              )}
              <span
                className={`role-badge user-menu-role${role === "ADMIN" ? " role-badge--admin" : role === "MANAGER" ? " role-badge--manager" : role === "MARKETING" ? " role-badge--marketing" : ""}`}
              >
                {roleLabel(role, t)}
              </span>
            </div>
            <Link
              href="/profile"
              className="user-menu-link"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {t("profile.title")}
            </Link>
            <Link
              href="/equipo"
              className="user-menu-link"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {t("profile.team")}
            </Link>
            <button
              type="button"
              className="user-menu-signout"
              role="menuitem"
              onClick={handleSignOut}
            >
              {t("auth.signOut")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
