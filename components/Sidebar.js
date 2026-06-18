import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/leads", label: "Leads" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/tasks", label: "Tareas" },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";

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
          <Link href="/admin/users" className="sidebar-link">
            Equipo
          </Link>
        )}
      </nav>
      <div className="sidebar-foot">
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
