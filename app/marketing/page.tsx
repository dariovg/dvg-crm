// app/marketing/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { canAccessMarketing, canApproveMarketingPosts } from "@/lib/permissions";
import { getMarketingDashboardStats } from "@/lib/marketing-stats";

export default async function MarketingDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (!canAccessMarketing(session)) redirect("/dashboard");

  const stats = await getMarketingDashboardStats();
  const isAdmin = canApproveMarketingPosts(session);

  return (
    <div className="page-pad">
      <header className="page-head">
        <div>
          <h1>Marketing</h1>
          <p className="page-sub">
            Contenido, aprobaciones y rendimiento en redes — integrado en el CRM
          </p>
        </div>
        <Link href="/marketing/create" className="btn btn-primary">
          + Crear contenido
        </Link>
      </header>

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
          <div className="marketing-kpi-value">{stats.newLeads24h}</div>
          <div className="marketing-kpi-label">Leads nuevos (24h)</div>
        </div>
        <div className="marketing-kpi marketing-kpi--orange">
          <div className="marketing-kpi-value">{stats.pendingCount}</div>
          <div className="marketing-kpi-label">Pendientes de aprobación</div>
        </div>
      </div>

      <div className="marketing-cards-grid">
        <Link href="/marketing/pending" className="marketing-card">
          <h2>Pendientes</h2>
          <p>{stats.pendingCount} posts esperando revisión</p>
        </Link>
        <Link href="/marketing/published" className="marketing-card">
          <h2>Publicados</h2>
          <p>{stats.publishedCount} posts en vivo</p>
        </Link>
        <Link href="/marketing/create" className="marketing-card">
          <h2>Crear contenido</h2>
          <p>Nuevo post para redes sociales</p>
        </Link>
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
            Ver analítica completa →
          </Link>
        </section>

        <section className="panel">
          <h2 className="panel-title">Leads recientes</h2>
          {stats.recentLeads.length === 0 ? (
            <p className="muted">Sin leads nuevos todavía.</p>
          ) : (
            <ul className="marketing-lead-list">
              {stats.recentLeads.map((lead) => (
                <li key={lead.id}>
                  <Link href={`/leads/${lead.id}`}>
                    <strong>{lead.name || lead.email}</strong>
                    {lead.company ? ` · ${lead.company}` : ""}
                    {lead.leadScore != null ? (
                      <span className="lead-score">Score {lead.leadScore}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {isAdmin && stats.recentPending.length > 0 && (
        <section className="panel">
          <div className="panel-head-row">
            <h2 className="panel-title">Revisión rápida</h2>
            <Link href="/marketing/pending" className="text-link">
              Ver todos
            </Link>
          </div>
          <ul className="marketing-pending-list">
            {stats.recentPending.map((post) => (
              <li key={post.id}>
                <span className="platform-tag">{post.platform}</span>
                <p>{post.content.slice(0, 120)}{post.content.length > 120 ? "…" : ""}</p>
                <span className="muted">
                  {post.createdBy?.name || "Sin autor"}
                  {post.campaign ? ` · ${post.campaign.name}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
