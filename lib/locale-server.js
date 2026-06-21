import { cookies } from "next/headers";
import { defaultLocale } from "./i18n";

/** Locale del usuario en server components (cookie + fallback). */
export async function getServerLocale() {
  const cookieStore = await cookies();
  const value = cookieStore.get("dvg-crm-locale")?.value;
  return value === "en" ? "en" : defaultLocale;
}
