"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/marketing", label: "Resumen", exact: true },
  { href: "/marketing/create", label: "Crear contenido" },
  { href: "/marketing/pending", label: "Pendientes" },
  { href: "/marketing/published", label: "Publicados" },
  { href: "/marketing/analytics", label: "Analítica" },
];

export default function MarketingSubnav() {
  const pathname = usePathname();

  function isActive(href, exact) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="marketing-subnav" aria-label="Marketing">
      {ITEMS.map((item) => (
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
    </nav>
  );
}
