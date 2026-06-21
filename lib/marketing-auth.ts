import type { Session } from "next-auth";
import { canAccessMarketing } from "./permissions";

export function isMarketingAuthorized(session: Session | null): boolean {
  return canAccessMarketing(session);
}

export function requireMarketingRole(session: Session | null): void {
  if (!isMarketingAuthorized(session)) {
    throw new Error("Unauthorized: Marketing role required");
  }
}
