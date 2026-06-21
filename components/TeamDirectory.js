"use client";

import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { useLocale } from "@/components/LocaleProvider";
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

export default function TeamDirectory({ users, currentUserId }) {
  const { locale, t } = useLocale();

  return (
    <div className="team-directory">
      {users.map((u) => (
        <article
          key={u.id}
          className={`team-card${u.id === currentUserId ? " team-card--self" : ""}`}
        >
          <UserAvatar
            name={u.name}
            email={u.email}
            image={u.image}
            profileStatus={u.profileStatus}
            size={56}
            showStatus
            locale={locale}
          />
          <div className="team-card-body">
            <strong>{u.name || u.email}</strong>
            {u.name && <span className="team-card-email">{u.email}</span>}
            <span className="role-badge team-card-role">{roleLabel(u.role, t)}</span>
            <span
              className={`presence-pill presence-pill--${(u.profileStatus || "AVAILABLE").toLowerCase()}`}
            >
              {presenceLabel(u.profileStatus, locale)}
            </span>
            {u.statusMessage && (
              <p className="team-card-status-msg">{u.statusMessage}</p>
            )}
          </div>
          {u.id === currentUserId && (
            <Link href="/profile" className="btn-secondary btn-sm">
              {t("profile.editMine")}
            </Link>
          )}
        </article>
      ))}
    </div>
  );
}
