// app/marketing/analytics/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { canAccessMarketing } from "@/lib/permissions";
import { getMarketingAnalytics } from "@/lib/marketing-stats";
import AnalyticsWidget from "@/components/marketing/AnalyticsWidget";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (!canAccessMarketing(session)) redirect("/dashboard");

  const analytics = await getMarketingAnalytics(30);

  return (
    <div className="page-pad">
      <header className="page-head">
        <div>
          <h1>Analítica</h1>
          <p className="page-sub">
            Métricas de los últimos 30 días · {analytics.postCount} posts publicados
          </p>
        </div>
        <Link href="/marketing" className="text-link">
          ← Volver al resumen
        </Link>
      </header>

      <div className="marketing-kpi-grid marketing-kpi-grid--widgets">
        <AnalyticsWidget
          title="Impresiones"
          value={analytics.totalImpressions}
          icon="👁️"
          color="blue"
        />
        <AnalyticsWidget
          title="Likes"
          value={analytics.totalLikes}
          icon="❤️"
          color="red"
        />
        <AnalyticsWidget
          title="Comentarios"
          value={analytics.totalComments}
          icon="💬"
          color="green"
        />
        <AnalyticsWidget
          title="Compartidos"
          value={analytics.totalShares}
          icon="🔁"
          color="purple"
        />
      </div>

      <section className="panel">
        <h2 className="panel-title">Rendimiento</h2>
        <div className="marketing-metrics-row">
          <div>
            <span className="muted">Engagement rate</span>
            <strong>{analytics.engagementRate}%</strong>
          </div>
          <div>
            <span className="muted">CTR</span>
            <strong>{analytics.ctr}%</strong>
          </div>
        </div>
        {analytics.postCount === 0 && (
          <p className="muted" style={{ marginTop: "1rem" }}>
            Aún no hay posts publicados con métricas. Cuando apruebes y publiques
            contenido, verás datos aquí.
          </p>
        )}
      </section>
    </div>
  );
}
