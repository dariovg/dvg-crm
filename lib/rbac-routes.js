export const SALES_PREFIXES = [
  "/dashboard",
  "/leads",
  "/pipeline",
  "/calendar",
  "/tasks",
  "/presupuestos",
];

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

/** Redirección cuando un rol sin marketing accede a /marketing. */
export function marketingModuleRedirect(role, pathname) {
  if (!pathname.startsWith("/marketing")) return null;
  if (role === "ADMIN" || role === "MARKETING") return null;
  return "/dashboard";
}
