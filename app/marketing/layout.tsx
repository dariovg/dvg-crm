// app/marketing/layout.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import Link from "next/link";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default async function MarketingLayout({
  children,
}: MarketingLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "MARKETING") {
    redirect("/dashboard");
  }

  const navItems = [
    { href: "/marketing/dashboard", label: "📊 Dashboard", icon: "dashboard" },
    { href: "/marketing/create", label: "✍️ Create", icon: "create" },
    { href: "/marketing/pending", label: "⏳ Pending", icon: "pending" },
    { href: "/marketing/published", label: "✅ Published", icon: "published" },
    { href: "/marketing/analytics", label: "📈 Analytics", icon: "analytics" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex gap-6 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors whitespace-nowrap pb-2 border-b-2 border-transparent hover:border-blue-600"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main>{children}</main>
    </div>
  );
}
