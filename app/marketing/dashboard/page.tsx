// app/marketing/dashboard/page.tsx
// Dashboard de marketing - Vista ADMIN + MARKETING

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";

export default async function MarketingDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "MARKETING") {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">📱 Marketing - Social Media</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded">
          <div className="text-2xl font-bold">7,234</div>
          <div className="text-sm text-gray-600">Impresiones (hoy)</div>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <div className="text-2xl font-bold">342</div>
          <div className="text-sm text-gray-600">Likes</div>
        </div>
        <div className="bg-purple-50 p-4 rounded">
          <div className="text-2xl font-bold">2</div>
          <div className="text-sm text-gray-600">Leads generados</div>
        </div>
        <div className="bg-orange-50 p-4 rounded">
          <div className="text-2xl font-bold">3</div>
          <div className="text-sm text-gray-600">Posts pendientes</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">📝 Posts Pendientes de Aprobación</h2>
        <p className="text-gray-600">Próximamente: Lista de posts para aprobar</p>
      </div>
    </div>
  );
}
