import {
  canAccessCommercialCrm,
  canAccessMarketing,
  canAccessTasksCalendar,
  canAccessImport,
  canAccessCeoDashboard,
  isAdmin,
  isStaff,
} from "./permissions";

export const COMMERCIAL_LINKS = [
  { href: "/dashboard", label: "Resumen", icon: "dashboard" },
  { href: "/leads", label: "Leads", icon: "leads" },
  { href: "/pipeline", label: "Pipeline", icon: "pipeline" },
  { href: "/presupuestos", label: "Presupuestos", icon: "presupuestos" },
];

export const OPERATIONS_LINKS = [
  { href: "/tasks", label: "Tareas", icon: "tasks" },
  { href: "/calendar", label: "Calendario", icon: "calendar" },
];

export const NAV_LINKS = [...COMMERCIAL_LINKS, ...OPERATIONS_LINKS];

export const TAB_LINKS = [
  { href: "/dashboard", label: "Inicio", short: "Inicio", icon: "dashboard" },
  { href: "/leads", label: "Leads", short: "Leads", icon: "leads" },
  { href: "/pipeline", label: "Pipeline", short: "Pipe", icon: "pipeline" },
  { href: "/tasks", label: "Tareas", short: "Tareas", icon: "tasks" },
];

const MARKETING_LINK = { href: "/marketing", label: "Marketing", icon: "marketing" };
const CEO_LINK = { href: "/ceo", label: "Panel CEO", icon: "dashboard" };
const ADMIN_LINKS = [
  { href: "/admin/users", label: "Equipo", icon: "users" },
  { href: "/admin/crm-settings", label: "CRM", icon: "settings" },
  { href: "/admin/security", label: "Seguridad", icon: "security" },
  { href: "/admin/audit", label: "Auditoría", icon: "audit" },
];
const IMPORT_LINK = { href: "/leads/import", label: "Importar CSV", icon: "import" };

/** Secciones colapsables del sidebar por departamento. */
export function getNavSectionsForSession(session) {
  const sections = [];

  if (canAccessCommercialCrm(session)) {
    const links = [...COMMERCIAL_LINKS];
    if (canAccessTasksCalendar(session)) {
      links.push(...OPERATIONS_LINKS);
    }
    if (canAccessImport(session)) {
      links.push(IMPORT_LINK);
    }
    sections.push({
      id: "commercial",
      labelKey: "sidebar.section.commercial",
      links,
    });
  }

  if (canAccessMarketing(session)) {
    sections.push({
      id: "marketing",
      labelKey: "sidebar.section.marketing",
      links: [MARKETING_LINK],
    });
  }

  if (canAccessCeoDashboard(session)) {
    sections.push({
      id: "ceo",
      labelKey: "sidebar.section.ceo",
      links: [CEO_LINK],
    });
  }

  if (isAdmin(session)) {
    sections.push({
      id: "admin",
      labelKey: "sidebar.section.admin",
      links: ADMIN_LINKS,
    });
  }

  return sections;
}

export function getNavLinksForRole(role) {
  return getNavLinksForSession({ user: { role } });
}

export function getNavLinksForSession(session) {
  return getNavSectionsForSession(session).flatMap((s) => s.links);
}

export function getTabLinksForSession(session) {
  if (!canAccessCommercialCrm(session)) return [];
  if (!canAccessTasksCalendar(session)) {
    return TAB_LINKS.filter((t) => t.href !== "/tasks");
  }
  return TAB_LINKS;
}
