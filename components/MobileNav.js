"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { NAV_LINKS, TAB_LINKS } from "@/lib/nav-links";
import { isStaff, canAccessMarketing } from "@/lib/permissions";
import ThemeToggle from "@/components/ThemeToggle";

function NavIcon({ name }) {
  const icons = {
    dashboard: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    leads: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    pipeline: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="3" y="3" width="5" height="18" rx="1" />
        <rect x="10" y="8" width="5" height="13" rx="1" />
        <rect x="17" y="5" width="4" height="16" rx="1" />
      </svg>
    ),
    tasks: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    more: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    ),
    menu: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    close: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    ),
  };
  return icons[name] || null;
}

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
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const marketing = canAccessMarketing({ user: session?.user });
  const staff = isStaff({ user: session?.user });

  function handleLinkClick() {
    onClose();
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
          <div className="sidebar-brand">
            <span className="brand-ia">DVG</span> CRM
            <p className="sidebar-tag">hacIA lo imparable</p>
          </div>
          <button type="button" className="mobile-drawer-close" onClick={onClose} aria-label="Cerrar">
            <NavIcon name="close" />
          </button>
        </div>
        <nav className="mobile-drawer-nav">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`mobile-drawer-link${pathname === l.href || pathname.startsWith(`${l.href}/`) ? " mobile-drawer-link--active" : ""}`}
              onClick={handleLinkClick}
            >
              {l.label}
            </Link>
          ))}
          {marketing && (
            <Link
              href="/marketing"
              className={`mobile-drawer-link${pathname.startsWith("/marketing") ? " mobile-drawer-link--active" : ""}`}
              onClick={handleLinkClick}
            >
              Marketing
            </Link>
          )}
          {isAdmin && (
            <>
              <Link
                href="/admin/users"
                className={`mobile-drawer-link${pathname.startsWith("/admin/users") ? " mobile-drawer-link--active" : ""}`}
                onClick={handleLinkClick}
              >
                Equipo
              </Link>
              <Link
                href="/admin/security"
                className={`mobile-drawer-link${pathname.startsWith("/admin/security") ? " mobile-drawer-link--active" : ""}`}
                onClick={handleLinkClick}
              >
                Seguridad
              </Link>
            </>
          )}
          {staff && (
            <Link
              href="/leads/import"
              className={`mobile-drawer-link${pathname.startsWith("/leads/import") ? " mobile-drawer-link--active" : ""}`}
              onClick={handleLinkClick}
            >
              Importar CSV
            </Link>
          )}
        </nav>
        <div className="mobile-drawer-foot">
          <ThemeToggle className="theme-toggle--sidebar" />
          {isAdmin && (
            <a href="/api/export/leads" className="mobile-drawer-link export-link" onClick={handleLinkClick}>
              Exportar CSV
            </a>
          )}
          {session?.user && (
            <div className="sidebar-user">
              <p>{session.user.name || session.user.email}</p>
              <span
                className={`role-badge${isAdmin ? " role-badge--admin" : isManager ? " role-badge--manager" : ""}`}
              >
                {isAdmin ? "Administración" : isManager ? "Manager" : "Equipo"}
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  signOut({ callbackUrl: "/login" });
                }}
              >
                Salir
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

  function isActive(href) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="bottom-tab-bar" aria-label="Navegación principal">
      {TAB_LINKS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`bottom-tab${isActive(tab.href) ? " bottom-tab--active" : ""}`}
        >
          <NavIcon name={tab.href.replace("/", "") === "dashboard" ? "dashboard" : tab.href.slice(1)} />
          <span>{tab.short}</span>
        </Link>
      ))}
      <button
        type="button"
        className={`bottom-tab${pathname.startsWith("/calendar") || pathname.startsWith("/presupuestos") || pathname.startsWith("/admin") || pathname.startsWith("/marketing") || pathname.startsWith("/leads/import") ? " bottom-tab--active" : ""}`}
        onClick={onMoreClick}
      >
        <NavIcon name="more" />
        <span>Más</span>
      </button>
    </nav>
  );
}
