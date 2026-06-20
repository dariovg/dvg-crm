/**
 * i18n CRM — español (por defecto) e inglés.
 */

export const LOCALE_STORAGE_KEY = "dvg-crm-locale";
export const defaultLocale = "es";

const messages = {
  es: {
    "common.dismiss": "Ocultar",
    "common.close": "Cerrar",
    "common.learnMore": "Saber más",
    "common.go": "Ir →",
    "help.title": "Ayuda",
    "help.noContent": "Sin ayuda específica para esta sección.",
    "onboarding.dismiss": "Ocultar guía",
    "onboarding.progress": "{done} de {total} completados",
    "locale.label": "Idioma",
    "locale.spanish": "Español",
    "locale.english": "English",
    "nav.dashboard": "Resumen",
    "nav.leads": "Leads",
    "nav.pipeline": "Pipeline",
    "nav.tasks": "Tareas",
    "nav.calendar": "Calendario",
    "nav.presupuestos": "Presupuestos",
    "nav.marketing": "Marketing",
    "nav.users": "Equipo",
    "nav.crmSettings": "CRM",
    "nav.security": "Seguridad",
    "nav.audit": "Auditoría",
    "nav.import": "Importar CSV",
    "nav.export": "Exportar CSV",
    "nav.home": "Inicio",
    "nav.more": "Más",
    "nav.account": "Cuenta",
    "role.admin": "Administración",
    "role.manager": "Manager",
    "role.marketing": "Marketing",
    "role.member": "Equipo",
    "auth.signOut": "Cerrar sesión",
    "theme.light": "Modo claro",
    "theme.dark": "Modo oscuro",
    "theme.toLight": "Cambiar a modo claro",
    "theme.toDark": "Cambiar a modo oscuro",
    "sidebar.commercial": "Comercial",
    "sidebar.shortcuts": "atajos",
    "sidebar.search": "buscar",
  },
  en: {
    "common.dismiss": "Dismiss",
    "common.close": "Close",
    "common.learnMore": "Learn more",
    "common.go": "Go →",
    "help.title": "Help",
    "help.noContent": "No specific help for this section.",
    "onboarding.dismiss": "Hide guide",
    "onboarding.progress": "{done} of {total} completed",
    "locale.label": "Language",
    "locale.spanish": "Spanish",
    "locale.english": "English",
    "nav.dashboard": "Overview",
    "nav.leads": "Leads",
    "nav.pipeline": "Pipeline",
    "nav.tasks": "Tasks",
    "nav.calendar": "Calendar",
    "nav.presupuestos": "Quotes",
    "nav.marketing": "Marketing",
    "nav.users": "Team",
    "nav.crmSettings": "CRM",
    "nav.security": "Security",
    "nav.audit": "Audit",
    "nav.import": "Import CSV",
    "nav.export": "Export CSV",
    "nav.home": "Home",
    "nav.more": "More",
    "nav.account": "Account",
    "role.admin": "Administration",
    "role.manager": "Manager",
    "role.marketing": "Marketing",
    "role.member": "Team",
    "auth.signOut": "Sign out",
    "theme.light": "Light mode",
    "theme.dark": "Dark mode",
    "theme.toLight": "Switch to light mode",
    "theme.toDark": "Switch to dark mode",
    "sidebar.commercial": "Sales",
    "sidebar.shortcuts": "shortcuts",
    "sidebar.search": "search",
  },
};

/** @param {string} key @param {"es"|"en"} [locale] @param {Record<string, string|number>} [vars] */
export function t(key, locale = defaultLocale, vars = {}) {
  let text = messages[locale]?.[key] ?? messages.es[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(`{${k}}`, String(v));
  }
  return text;
}

const NAV_LABEL_KEYS = {
  "/dashboard": "nav.dashboard",
  "/leads": "nav.leads",
  "/pipeline": "nav.pipeline",
  "/tasks": "nav.tasks",
  "/calendar": "nav.calendar",
  "/presupuestos": "nav.presupuestos",
  "/marketing": "nav.marketing",
  "/admin/users": "nav.users",
  "/admin/crm-settings": "nav.crmSettings",
  "/admin/security": "nav.security",
  "/admin/audit": "nav.audit",
  "/leads/import": "nav.import",
};

/** @param {string} href @param {"es"|"en"} locale */
export function navLabel(href, locale = defaultLocale) {
  const key = NAV_LABEL_KEYS[href];
  return key ? t(key, locale) : href;
}
