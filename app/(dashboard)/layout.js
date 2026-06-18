import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
