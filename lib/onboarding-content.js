/** Guided checklist steps shown on first login per role (non-blocking). */

const ONBOARDING_ES = {
  ADMIN: {
    title: "Primeros pasos — Administrador",
    steps: [
      {
        id: "dashboard",
        label: "Revisa el resumen y KPIs del dashboard",
        href: "/dashboard",
      },
      {
        id: "team",
        label: "Configura usuarios y roles en Equipo",
        href: "/admin/users",
      },
      {
        id: "crm-settings",
        label: "Ajusta reglas de scoring e inactividad",
        href: "/admin/crm-settings",
      },
      {
        id: "marketing-pending",
        label: "Revisa posts pendientes de aprobación",
        href: "/marketing/pending",
      },
      {
        id: "security",
        label: "Revisa sesiones activas en Seguridad",
        href: "/admin/security",
      },
    ],
  },
  MANAGER: {
    title: "Primeros pasos — Manager",
    steps: [
      {
        id: "dashboard",
        label: "Revisa el resumen del pipeline",
        href: "/dashboard",
      },
      {
        id: "unassigned",
        label: "Asigna leads sin responsable",
        href: "/leads",
      },
      {
        id: "pipeline",
        label: "Mueve oportunidades en el pipeline",
        href: "/pipeline",
      },
      {
        id: "calendar",
        label: "Consulta el calendario de equipo",
        href: "/calendar",
      },
    ],
  },
  MEMBER: {
    title: "Primeros pasos — Equipo comercial",
    steps: [
      {
        id: "leads",
        label: "Revisa tus leads asignados",
        href: "/leads",
      },
      {
        id: "tasks",
        label: "Completa tareas pendientes",
        href: "/tasks",
      },
      {
        id: "calendar",
        label: "Consulta reuniones en el calendario",
        href: "/calendar",
      },
      {
        id: "quotes",
        label: "Crea presupuestos para tus oportunidades",
        href: "/presupuestos",
      },
    ],
  },
  MARKETING: {
    title: "Primeros pasos — Marketing",
    steps: [
      {
        id: "marketing-dash",
        label: "Explora el panel de marketing",
        href: "/marketing/dashboard",
      },
      {
        id: "create",
        label: "Crea tu primer post",
        href: "/marketing/create",
      },
      {
        id: "calendar",
        label: "Planifica la semana en el calendario",
        href: "/marketing/calendario",
      },
      {
        id: "pending",
        label: "Envía posts a aprobación del admin",
        href: "/marketing/pending",
      },
    ],
  },
};

const ONBOARDING_EN = {
  ADMIN: {
    title: "Getting started — Administrator",
    steps: [
      { id: "dashboard", label: "Review dashboard summary and KPIs", href: "/dashboard" },
      { id: "team", label: "Configure users and roles in Team", href: "/admin/users" },
      { id: "crm-settings", label: "Adjust scoring and inactivity rules", href: "/admin/crm-settings" },
      { id: "marketing-pending", label: "Review posts pending approval", href: "/marketing/pending" },
      { id: "security", label: "Review active sessions in Security", href: "/admin/security" },
    ],
  },
  MANAGER: {
    title: "Getting started — Manager",
    steps: [
      { id: "dashboard", label: "Review pipeline summary", href: "/dashboard" },
      { id: "unassigned", label: "Assign unassigned leads", href: "/leads" },
      { id: "pipeline", label: "Move opportunities in the pipeline", href: "/pipeline" },
      { id: "tasks", label: "Review overdue team tasks", href: "/tasks" },
      { id: "calendar", label: "Check the team calendar", href: "/calendar" },
    ],
  },
  MEMBER: {
    title: "Getting started — Sales team",
    steps: [
      { id: "leads", label: "Review your assigned leads", href: "/leads" },
      { id: "tasks", label: "Complete pending tasks", href: "/tasks" },
      { id: "calendar", label: "Check meetings in the calendar", href: "/calendar" },
      { id: "quotes", label: "Create quotes for your opportunities", href: "/presupuestos" },
    ],
  },
  MARKETING: {
    title: "Getting started — Marketing",
    steps: [
      { id: "marketing-dash", label: "Explore the marketing dashboard", href: "/marketing/dashboard" },
      { id: "create", label: "Create your first post", href: "/marketing/create" },
      { id: "calendar", label: "Plan the week in the calendar", href: "/marketing/calendario" },
      { id: "pending", label: "Submit posts for admin approval", href: "/marketing/pending" },
    ],
  },
};

export const ONBOARDING_BY_ROLE = ONBOARDING_ES;

/** @param {string | undefined} role @param {"es"|"en"} [locale] */
export function getOnboardingForRole(role, locale = "es") {
  const map = locale === "en" ? ONBOARDING_EN : ONBOARDING_ES;
  if (!role || !map[role]) return null;
  return map[role];
}

export function onboardingStorageKey(userId) {
  return `dvg-crm-onboarding-${userId || "anon"}`;
}
