// lib/marketing-auth.ts
import { Session } from "next-auth";

export function isMarketingAuthorized(session: Session | null): boolean {
  if (!session || !session.user) return false;
  return (
    session.user.role === "ADMIN" || session.user.role === "MARKETING"
  );
}

export function requireMarketingRole(session: Session | null): void {
  if (!isMarketingAuthorized(session)) {
    throw new Error("Unauthorized: Marketing role required");
  }
}
