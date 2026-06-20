// app/marketing/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { canAccessMarketing, canApproveMarketingPosts, canAccessSalesCrm } from "@/lib/permissions";
import { getMarketingDashboardStats } from "@/lib/marketing-stats";
import { isTwitterConfigured } from "@/lib/social/twitter.js";

export default async function MarketingDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (!canAccessMarketing(session)) redirect("/dashboard");

  const showLeadLinks = canAccessSalesCrm(session);
  const stats = await getMarketingDashboardStats({ includeLeads: showLeadLinks });
  const newLeads24h =
    typeof stats.newLeads24h === "number" ? stats.newLeads24h : 0;
  const recentLeads = Array.isArray(stats.recentLeads) ? stats.recentLeads : [];
  const isAdmin = canApproveMarketingPosts(session);
  const xReady = isTwitterConfigured();

  return (
    <div className="page-pad">
      <header className="page-head">
        <div>
          <h1>Marketing</h1>
          <p className="page-sub">
            Contenido diario → revisión → publicación en X
          </p>
        </div>
        <Link href="/marketing/create" className="btn btn-primary">
          + Post de hoy
        </Link>
      </header>

      <section className="marketing-pipeline">
        <Link href="/marketing/create" className="marketing-pipeline-step">
          <span className="marketing-pipeline-num">1</span>
          <strong>Crear</strong>
          <span className="muted">Redacta o plantilla</span>
        </Link>
        <Link href="/marketing/pending" className="marketing-pipeline-step">
          <span className="marketing-pipeline-num">{stats.pendingCount}</span>
          <strong>Revisar</strong>
          <span className="muted">Pendientes</span>
        </Link>
        <Link href="/marketing/approved" className="marketing-pipeline-step">
          <span className="marketing-pipeline-num">
            {stats.approvedCount + stats.scheduledCount}
          </span>
          <strong>Publicar</strong>
          <span className="muted">Listos / programados</span>
        </Link>
        <Link href="/marketing/published" className="marketing-pipeline-step">
          <span className="marketing-pipeline-num">{stats.publishedCount}</span>
          <strong>Historial</strong>
          <span className="muted">En vivo</span>
        </Link>
      </section>

      {isAdmin && !xReady && (
        <div className="alert alert-warn">
          Configura las claves de X en Vercel para publicar con un clic desde{" "}
          <Link href="/marketing/approved">Publicar</Link>.
        </div>
      )}

      <div className="marketing-kpi-grid">
        <div className="marketing-kpi marketing-kpi--blue">
          <div className="marketing-kpi-value">
            {stats.impressions24h.toLocaleString("es-ES")}
          </div>
          <div className="marketing-kpi-label">Impresiones (24h)</div>
        </div>
        <div className="marketing-kpi marketing-kpi--green">
          <div className="marketing-kpi-value">
            {stats.likes7d.toLocaleString("es-ES")}
          </div>
          <div className="marketing-kpi-label">Likes (7 días)</div>
        </div>
        <div className="marketing-kpi marketing-kpi--purple">
          <div className="marketing-kpi-value">
            {showLeadLinks ? newLeads24h : "—"}
          </div>
          <div className="marketing-kpi-label">Leads nuevos (24h)</div>
        </div>
        <div className="marketing-kpi marketing-kpi--orange">
          <div className="marketing-kpi-value">{stats.approvedCount}</div>
          <div className="marketing-kpi-label">Listos para publicar</div>
        </div>
      </div>

      <div className="marketing-panels">
        <section className="panel">
          <h2 className="panel-title">Analítica (7 días)</h2>
          <div className="marketing-metrics-row">
            <div>
              <span className="muted">Engagement</span>
              <strong>{stats.engagementRate}%</strong>
            </div>
            <div>
              <span className="muted">CTR</span>
              <strong>{stats.ctr}%</strong>
            </div>
          </div>
          <Link href="/marketing/analytics" className="text-link">
            Ver analítica →
          </Link>
        </section>

        {showLeadLinks && (
        <section className="panel">
          <h2 className="panel-title">Leads recientes</h2>
          {recentLeads.length === 0 ? (
            <p className="muted">Sin leads nuevos.</p>
          ) : (
            <ul className="marketing-lead-list">
              {recentLeads.map((lead) => (
                <li key={lead.id}>
                  <Link href={`/leads/${lead.id}`}>
                    <strong>{lead.name || lead.email}</strong>
                    {lead.company ? ` · ${lead.company}` : ""}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        )}
      </div>

      {isAdmin && stats.recentApproved.length > 0 && (
        <section className="panel">
          <div className="panel-head-row">
            <h2 className="panel-title">Publicar ahora</h2>
            <Link href="/marketing/approved" className="text-link">
              Ir a cola →
            </Link>
          </div>
          <ul className="marketing-pending-list">
            {stats.recentApproved.map((post) => (
              <li key={post.id}>
                <span className="platform-tag">{post.platform}</span>
                <p>
                  {post.content.slice(0, 100)}
                  {post.content.length > 100 ? "…" : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
