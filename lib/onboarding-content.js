/** Guided checklist steps shown on first login per role (non-blocking). */

export const ONBOARDING_BY_ROLE = {
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
        label: "Activa 2FA y revisa sesiones activas",
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
        id: "tasks",
        label: "Revisa tareas vencidas del equipo",
        href: "/tasks",
      },
      {
        id: "import",
        label: "Importa leads desde CSV si hace falta",
        href: "/leads/import",
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

/** @param {string | undefined} role */
export function getOnboardingForRole(role) {
  if (!role || !ONBOARDING_BY_ROLE[role]) return null;
  return ONBOARDING_BY_ROLE[role];
}

export function onboardingStorageKey(userId) {
  return `dvg-crm-onboarding-${userId || "anon"}`;
}
