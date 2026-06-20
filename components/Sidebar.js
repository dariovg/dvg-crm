"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { getNavLinksForSession } from "@/lib/nav-links";
import ThemeToggle from "@/components/ThemeToggle";
import NavIcon from "@/components/NavIcon";
import BrandLogo from "@/components/BrandLogo";

export default function Sidebar() {
  const { data: session } = useSession();
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
          <span className="sidebar-nav-label">Comercial</span>
        )}
        {navLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`sidebar-link${isActive(l.href) ? " sidebar-link--active" : ""}`}
          >
            <NavIcon name={l.icon} className="sidebar-link-icon" />
            <span>{l.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-foot">
        <ThemeToggle className="theme-toggle--sidebar" />
        {role !== "MARKETING" && (
          <p className="shortcuts-hint">
            <kbd>?</kbd> atajos · <kbd>⌘K</kbd> buscar
          </p>
        )}
        {isAdmin && (
          <a href="/api/export/leads" className="sidebar-link export-link">
            <NavIcon name="export" className="sidebar-link-icon" />
            <span>Exportar CSV</span>
          </a>
        )}
        {session?.user && (
          <div className="sidebar-user">
            <p>{session.user.name || session.user.email}</p>
            <span
              className={`role-badge${isAdmin ? " role-badge--admin" : isManager ? " role-badge--manager" : role === "MARKETING" ? " role-badge--marketing" : ""}`}
            >
              {isAdmin
                ? "Administración"
                : isManager
                  ? "Manager"
                  : role === "MARKETING"
                    ? "Marketing"
                    : "Equipo"}
            </span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
