"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getNavSectionsForSession } from "@/lib/nav-links";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import NavIcon from "@/components/NavIcon";
import BrandLogo from "@/components/BrandLogo";
import { useLocale } from "@/components/LocaleProvider";
import { navLabel } from "@/lib/i18n";

function sectionHasActiveLink(links, pathname) {
  return links.some((l) => {
    if (l.href === "/dashboard") return pathname === "/dashboard";
    return pathname === l.href || pathname.startsWith(`${l.href}/`);
  });
}

export default function Sidebar() {
  const { data: session } = useSession();
  const { locale, t } = useLocale();
  const pathname = usePathname();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isCommercial = role === "COMMERCIAL";
  const sections = getNavSectionsForSession(session);
  const isMarketingOnly = role === "MARKETING";

  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(sections.map((s) => [s.id, true]))
  );

  useEffect(() => {
    setOpenSections((prev) => {
      const next = { ...prev };
      for (const section of sections) {
        if (sectionHasActiveLink(section.links, pathname)) {
          next[section.id] = true;
        } else if (next[section.id] === undefined) {
          next[section.id] = true;
        }
      }
      return next;
    });
  }, [pathname, sections]);

  function isActive(href) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function toggleSection(id) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BrandLogo />
      </div>
      <nav className="sidebar-nav" aria-label="Principal">
        {sections.map((section) => {
          const isOpen = openSections[section.id] !== false;
          const hasActive = sectionHasActiveLink(section.links, pathname);
          return (
            <div
              key={section.id}
              className={`sidebar-section${hasActive ? " sidebar-section--active" : ""}`}
            >
              <button
                type="button"
                className="sidebar-section-toggle"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
              >
                <span>{t(section.labelKey)}</span>
                <NavIcon
                  name="chevron"
                  className={`sidebar-section-chevron${isOpen ? " sidebar-section-chevron--open" : ""}`}
                  size={14}
                />
              </button>
              {isOpen && (
                <div className="sidebar-section-links">
                  {section.links.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={`sidebar-link${isActive(l.href) ? " sidebar-link--active" : ""}`}
                    >
                      <NavIcon name={l.icon} className="sidebar-link-icon" />
                      <span>{navLabel(l.href, locale)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <div className="sidebar-locale">
          <span className="sidebar-locale-label">{t("locale.label")}</span>
          <LanguageToggle className="language-toggle--sidebar" />
        </div>
        <ThemeToggle className="theme-toggle--sidebar" />
        {!isMarketingOnly && (
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
              className={`role-badge${isAdmin ? " role-badge--admin" : isManager ? " role-badge--manager" : role === "MARKETING" ? " role-badge--marketing" : isCommercial ? " role-badge--commercial" : ""}`}
            >
              {isAdmin
                ? t("role.admin")
                : isManager
                  ? t("role.manager")
                  : role === "MARKETING"
                    ? t("role.marketing")
                    : isCommercial
                      ? t("role.commercial")
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
