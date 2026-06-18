import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import ThemeToggle from "@/components/ThemeToggle";
import { isStaff } from "@/lib/permissions";

const links = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/leads", label: "Leads" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/tasks", label: "Tareas" },
  { href: "/calendar", label: "Calendario" },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const staff = isStaff({ user: session?.user });

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-ia">DVG</span> CRM
        <p className="sidebar-tag">hacIA lo imparable</p>
      </div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="sidebar-link">
            {l.label}
          </Link>
        ))}
        {isAdmin && (
          <>
            <Link href="/admin/users" className="sidebar-link">
              Equipo
            </Link>
            <Link href="/admin/security" className="sidebar-link">
              Seguridad
            </Link>
          </>
        )}
        {staff && (
          <Link href="/leads/import" className="sidebar-link">
            Importar CSV
          </Link>
        )}
      </nav>
      <div className="sidebar-foot">
        <ThemeToggle />
        <p className="shortcuts-hint">
          <kbd>?</kbd> atajos · <kbd>⌘K</kbd> buscar
        </p>
        {isAdmin && (
          <a href="/api/export/leads" className="sidebar-link export-link">
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
