"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { getNavLinksForSession } from "@/lib/nav-links";
import ThemeToggle from "@/components/ThemeToggle";
import NavIcon from "@/components/NavIcon";
import BrandLogo from "@/components/BrandLogo";
import { useLocale } from "@/components/LocaleProvider";
import { navLabel } from "@/lib/i18n";

export default function Sidebar() {
  const { data: session } = useSession();
  const { locale, t } = useLocale();
  const pathname = usePathname();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const navLinks = getNavLinksForSession(session);
  const isMarketingOnly = role === "MARKETING";

  function isActive(href) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BrandLogo />
      </div>
      <nav className="sidebar-nav" aria-label="Principal">
        {!isMarketingOnly && (
          <span className="sidebar-nav-label">{t("sidebar.commercial")}</span>
        )}
        {navLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`sidebar-link${isActive(l.href) ? " sidebar-link--active" : ""}`}
          >
            <NavIcon name={l.icon} className="sidebar-link-icon" />
            <span>{navLabel(l.href, locale)}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-foot">
        <ThemeToggle className="theme-toggle--sidebar" />
        {role !== "MARKETING" && (
          <p className="shortcuts-hint">
            <kbd>?</kbd> {t("sidebar.shortcuts")} · <kbd>⌘K</kbd> {t("sidebar.search")}
          </p>
        )}
        {isAdmin && (
          <a href="/api/export/leads" className="sidebar-link export-link">
            <NavIcon name="export" className="sidebar-link-icon" />
            <span>{t("nav.export")}</span>
          </a>
        )}
        {session?.user && (
          <div className="sidebar-user">
            <p>{session.user.name || session.user.email}</p>
            <span
              className={`role-badge${isAdmin ? " role-badge--admin" : isManager ? " role-badge--manager" : role === "MARKETING" ? " role-badge--marketing" : ""}`}
            >
              {isAdmin
                ? t("role.admin")
                : isManager
                  ? t("role.manager")
                  : role === "MARKETING"
                    ? t("role.marketing")
                    : t("role.member")}
            </span>
            <button
              type="button"
              className="sidebar-signout-btn"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              {t("auth.signOut")}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
