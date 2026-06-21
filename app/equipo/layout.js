import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getAuthSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function EquipoLayout({ children }) {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
