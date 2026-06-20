"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { getNavLinksForSession, getTabLinksForSession } from "@/lib/nav-links";
import { canAccessSalesCrm } from "@/lib/permissions";
import ThemeToggle from "@/components/ThemeToggle";
import NavIcon from "@/components/NavIcon";
import BrandLogo from "@/components/BrandLogo";
import { useLocale } from "@/components/LocaleProvider";
import { navLabel } from "@/lib/i18n";

export function HamburgerButton({ open, onClick }) {
  return (
    <button
      type="button"
      className="mobile-menu-btn"
      onClick={onClick}
      aria-label={open ? "Cerrar menú" : "Abrir menú"}
      aria-expanded={open}
    >
      {open ? <NavIcon name="close" /> : <NavIcon name="menu" />}
    </button>
  );
}

export function MobileDrawer({ open, onClose }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { locale, t } = useLocale();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const navLinks = getNavLinksForSession(session);

  function handleLinkClick() {
    onClose();
  }

  function isActive(href) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <div
        className={`mobile-drawer-backdrop${open ? " mobile-drawer-backdrop--open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`mobile-drawer${open ? " mobile-drawer--open" : ""}`}
        aria-hidden={!open}
      >
        <div className="mobile-drawer-head">
          <BrandLogo className="brand-logo--drawer" />
          <button type="button" className="mobile-drawer-close" onClick={onClose} aria-label="Cerrar">
            <NavIcon name="close" />
          </button>
        </div>
        <nav className="mobile-drawer-nav">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`mobile-drawer-link${isActive(l.href) ? " mobile-drawer-link--active" : ""}`}
              onClick={handleLinkClick}
            >
              <NavIcon name={l.icon} size={20} />
              <span>{navLabel(l.href, locale)}</span>
            </Link>
          ))}
        </nav>
        <div className="mobile-drawer-foot">
          <ThemeToggle className="theme-toggle--sidebar" />
          {isAdmin && (
            <a href="/api/export/leads" className="mobile-drawer-link export-link" onClick={handleLinkClick}>
              {t("nav.export")}
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
                onClick={() => {
                  onClose();
                  signOut({ callbackUrl: "/login" });
                }}
              >
                {t("auth.signOut")}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export function BottomTabBar({ onMoreClick }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { locale, t } = useLocale();
  const tabLinks = getTabLinksForSession(session);
  const salesAccess = canAccessSalesCrm(session);

  function isActive(href) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (!salesAccess) {
    return (
      <nav className="bottom-tab-bar" aria-label="Navegación principal">
        <Link
          href="/marketing"
          className={`bottom-tab${pathname.startsWith("/marketing") ? " bottom-tab--active" : ""}`}
        >
          <NavIcon name="marketing" />
          <span>{t("nav.marketing")}</span>
        </Link>
        <button type="button" className="bottom-tab" onClick={onMoreClick}>
          <NavIcon name="more" />
          <span>{t("nav.account")}</span>
        </button>
      </nav>
    );
  }

  return (
    <nav className="bottom-tab-bar" aria-label="Navegación principal">
      {tabLinks.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`bottom-tab${isActive(tab.href) ? " bottom-tab--active" : ""}`}
        >
          <NavIcon name={tab.icon} size={20} />
          <span>{tab.href === "/dashboard" ? t("nav.home") : navLabel(tab.href, locale)}</span>
        </Link>
      ))}
      <button
        type="button"
        className={`bottom-tab${pathname.startsWith("/calendar") || pathname.startsWith("/presupuestos") || pathname.startsWith("/admin") || pathname.startsWith("/marketing") || pathname.startsWith("/leads/import") ? " bottom-tab--active" : ""}`}
        onClick={onMoreClick}
      >
        <NavIcon name="more" />
        <span>{t("nav.more")}</span>
      </button>
    </nav>
  );
}
