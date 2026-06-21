"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS = [
  {
    label: "Inicio",
    items: [{ href: "/marketing", label: "Resumen", exact: true }],
  },
  {
    label: "Contenido",
    items: [
      { href: "/marketing/create", label: "Crear" },
      { href: "/marketing/calendario", label: "Calendario" },
      { href: "/marketing/semana", label: "Semana" },
    ],
  },
  {
    label: "Flujo",
    items: [
      { href: "/marketing/pending", label: "Pendientes" },
      { href: "/marketing/approved", label: "Publicar" },
      { href: "/marketing/published", label: "Historial" },
    ],
  },
  {
    label: "Datos",
    items: [{ href: "/marketing/analytics", label: "Analítica" }],
  },
];

export default function MarketingSubnav() {
  const pathname = usePathname();

  function isActive(href, exact) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="marketing-subnav" aria-label="Marketing">
      {GROUPS.map((group) => (
        <div key={group.label} className="marketing-subnav-group">
          <span className="marketing-subnav-label">{group.label}</span>
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`marketing-subnav-link${
                isActive(item.href, item.exact) ? " marketing-subnav-link--active" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
