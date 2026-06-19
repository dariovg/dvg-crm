// app/marketing/page.tsx
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
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">📱 Marketing Dashboard</h1>
      
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">7,234</div>
          <div className="text-sm opacity-90">Impresiones (24h)</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">342</div>
          <div className="text-sm opacity-90">Likes</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">2</div>
          <div className="text-sm opacity-90">Leads nuevos</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">3</div>
          <div className="text-sm opacity-90">Posts pendientes</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <a href="/marketing/pending" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-bold mb-2">📝 Pendientes de Aprobación</h2>
          <p className="text-gray-600">3 posts esperando revisión</p>
        </a>
        <a href="/marketing/published" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-bold mb-2">✅ Publicados</h2>
          <p className="text-gray-600">127 posts en vivo</p>
        </a>
        <a href="/marketing/create" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-bold mb-2">➕ Crear Post</h2>
          <p className="text-gray-600">Nuevo post para redes</p>
        </a>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">📊 Analytics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="font-bold">Engagement Rate</div>
            <div className="text-2xl text-blue-600">6.2%</div>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <div className="font-bold">CTR</div>
            <div className="text-2xl text-green-600">3.1%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
