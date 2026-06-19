// app/marketing/layout.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { canAccessMarketing } from "@/lib/permissions";
import AppShell from "@/components/AppShell";
import MarketingSubnav from "@/components/MarketingSubnav";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default async function MarketingLayout({
  children,
}: MarketingLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (!canAccessMarketing(session)) redirect("/dashboard");

  return (
    <AppShell>
      <div className="marketing-shell">
        <MarketingSubnav />
        <div className="marketing-content">{children}</div>
      </div>
    </AppShell>
  );
}
