import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getAuthSession } from "@/lib/auth-server";
import { canAccessDashboardShell, getDefaultHomeForRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }) {
  const session = await getAuthSession();
  if (session?.user?.role && !canAccessDashboardShell(session)) {
    redirect(getDefaultHomeForRole(session.user.role));
  }

  return <AppShell>{children}</AppShell>;
}
