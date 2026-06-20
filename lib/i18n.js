/**
 * i18n foundation — Spanish primary. English deferred until team grows.
 * Add `en` messages and locale switcher when needed.
 */

const messages = {
  es: {
    "common.dismiss": "Ocultar",
    "common.close": "Cerrar",
    "common.learnMore": "Saber más",
    "help.title": "Ayuda",
    "help.noContent": "Sin ayuda específica para esta sección.",
    "onboarding.title": "Primeros pasos",
    "onboarding.dismiss": "Ocultar guía",
    "onboarding.progress": "{done} de {total} completados",
  },
};

/** @param {string} key @param {"es"} [locale] @param {Record<string, string|number>} [vars] */
export function t(key, locale = "es", vars = {}) {
  let text = messages[locale]?.[key] ?? messages.es[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(`{${k}}`, String(v));
  }
  return text;
}

export const defaultLocale = "es";
