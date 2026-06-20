import {
  canAccessSalesCrm,
  canAccessMarketing,
  isAdmin,
  isStaff,
} from "./permissions";

export const NAV_LINKS = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/leads", label: "Leads" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/tasks", label: "Tareas" },
  { href: "/calendar", label: "Calendario" },
  { href: "/presupuestos", label: "Presupuestos" },
];

export const TAB_LINKS = [
  { href: "/dashboard", label: "Inicio", short: "Inicio" },
  { href: "/leads", label: "Leads", short: "Leads" },
  { href: "/pipeline", label: "Pipeline", short: "Pipe" },
  { href: "/tasks", label: "Tareas", short: "Tareas" },
];

const MARKETING_LINK = { href: "/marketing", label: "Marketing" };
const ADMIN_LINKS = [
  { href: "/admin/users", label: "Equipo" },
  { href: "/admin/security", label: "Seguridad" },
];
const IMPORT_LINK = { href: "/leads/import", label: "Importar CSV" };

export function getNavLinksForRole(role) {
  return getNavLinksForSession({ user: { role } });
}

export function getNavLinksForSession(session) {
  const links = [];
  if (canAccessSalesCrm(session)) links.push(...NAV_LINKS);
  if (canAccessMarketing(session)) links.push(MARKETING_LINK);
  if (isAdmin(session)) links.push(...ADMIN_LINKS);
  if (isStaff(session)) links.push(IMPORT_LINK);
  return links;
}

export function getTabLinksForSession(session) {
  if (!canAccessSalesCrm(session)) return [];
  return TAB_LINKS;
}
