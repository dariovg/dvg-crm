import {
  canAccessSalesCrm,
  canAccessMarketing,
  isAdmin,
  isStaff,
} from "./permissions";

export const NAV_LINKS = [
  { href: "/dashboard", label: "Resumen", icon: "dashboard" },
  { href: "/leads", label: "Leads", icon: "leads" },
  { href: "/pipeline", label: "Pipeline", icon: "pipeline" },
  { href: "/tasks", label: "Tareas", icon: "tasks" },
  { href: "/calendar", label: "Calendario", icon: "calendar" },
  { href: "/presupuestos", label: "Presupuestos", icon: "presupuestos" },
];

export const TAB_LINKS = [
  { href: "/dashboard", label: "Inicio", short: "Inicio", icon: "dashboard" },
  { href: "/leads", label: "Leads", short: "Leads", icon: "leads" },
  { href: "/pipeline", label: "Pipeline", short: "Pipe", icon: "pipeline" },
  { href: "/tasks", label: "Tareas", short: "Tareas", icon: "tasks" },
];

const MARKETING_LINK = { href: "/marketing", label: "Marketing", icon: "marketing" };
const ADMIN_LINKS = [
  { href: "/admin/users", label: "Equipo", icon: "users" },
  { href: "/admin/security", label: "Seguridad", icon: "security" },
];
const IMPORT_LINK = { href: "/leads/import", label: "Importar CSV", icon: "import" };

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
