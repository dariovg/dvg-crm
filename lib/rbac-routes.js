export const SALES_PREFIXES = [
  "/dashboard",
  "/leads",
  "/pipeline",
  "/calendar",
  "/tasks",
  "/presupuestos",
  "/ceo",
];

export const COMMERCIAL_BLOCKED_PREFIXES = ["/tasks", "/calendar", "/leads/import"];

export function isSalesPath(pathname) {
  return SALES_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/** Redirección cuando marketing intenta acceder al CRM comercial. */
export function marketingSalesRedirect(role, pathname) {
  if (role === "MARKETING" && isSalesPath(pathname)) {
    return "/marketing";
  }
  return null;
}

/** Redirección cuando COMMERCIAL intenta tareas, calendario o importación. */
export function commercialRestrictedRedirect(role, pathname) {
  if (role !== "COMMERCIAL") return null;
  for (const prefix of COMMERCIAL_BLOCKED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return "/dashboard";
    }
  }
  return null;
}

/** Redirección cuando un rol sin marketing accede a /marketing. */
export function marketingModuleRedirect(role, pathname) {
  if (!pathname.startsWith("/marketing")) return null;
  if (role === "ADMIN" || role === "MARKETING") return null;
  return "/dashboard";
}

/** Solo ADMIN accede al dashboard ejecutivo. */
export function ceoDashboardRedirect(role, pathname) {
  if (!pathname.startsWith("/ceo")) return null;
  if (role === "ADMIN") return null;
  return "/dashboard";
}
