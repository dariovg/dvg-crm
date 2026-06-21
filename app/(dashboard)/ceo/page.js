import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-server";
import { canAccessCeoDashboard } from "@/lib/permissions";
import { getCeoDashboardStats } from "@/lib/ceo-stats";
import { CONTACT_STATUSES } from "@/lib/constants";
import { formatEuro } from "@/lib/pricing-catalog";

export const dynamic = "force-dynamic";

export default async function CeoDashboardPage() {
  const session = await getAuthSession();
  if (!canAccessCeoDashboard(session)) {
    redirect("/dashboard");
  }

  const { sales, marketing } = await getCeoDashboardStats();
  const statusLabels = Object.fromEntries(
    CONTACT_STATUSES.map((s) => [s.id, s.label])
  );

  return (
    <div className="page-pad">
      <header className="page-head">
        <div>
          <h1>Panel ejecutivo</h1>
          <p className="page-sub">
            Vista consolidada de ventas y marketing para administración.
          </p>
        </div>
      </header>

      <section className="ceo-section">
        <h2 className="panel-title">Ventas</h2>
        <div className="ceo-kpi-grid">
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">Leads totales</span>
            <strong className="ceo-kpi-value">{sales.totalLeads}</strong>
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">Nuevos (7 días)</span>
            <strong className="ceo-kpi-value">{sales.newLeadsWeek}</strong>
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">Ganados</span>
            <strong className="ceo-kpi-value">{sales.wonLeads}</strong>
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">Pipeline (valor)</span>
            <strong className="ceo-kpi-value">
              {formatEuro(sales.pipelineValue)}
            </strong>
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">Presupuestos abiertos</span>
            <strong className="ceo-kpi-value">{sales.openQuotes}</strong>
          </div>
          <div className="ceo-kpi-card ceo-kpi-card--warn">
            <span className="ceo-kpi-label">Pendientes aprobación</span>
            <strong className="ceo-kpi-value">{sales.pendingQuotes}</strong>
            {sales.pendingQuotes > 0 && (
              <Link href="/presupuestos?status=PENDING_APPROVAL" className="ceo-kpi-link">
                Revisar →
              </Link>
            )}
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">Aceptados (30 días)</span>
            <strong className="ceo-kpi-value">{sales.acceptedQuotesMonth}</strong>
          </div>
        </div>

        <div className="ceo-two-col">
          <div className="panel">
            <h3 className="panel-title">Pipeline por estado</h3>
            <ul className="ceo-status-list">
              {sales.leadsByStatus.map((row) => (
                <li key={row.status}>
                  <span>{statusLabels[row.status] || row.status}</span>
                  <strong>{row.count}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h3 className="panel-title">Top comerciales</h3>
            <ul className="ceo-status-list">
              {sales.topAssignees.length ? (
                sales.topAssignees.map((row) => (
                  <li key={row.user?.id || "none"}>
                    <span>{row.user?.name || row.user?.email || "—"}</span>
                    <strong>{row.count} leads</strong>
                  </li>
                ))
              ) : (
                <li className="muted">Sin asignaciones</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      <section className="ceo-section">
        <h2 className="panel-title">Marketing</h2>
        <div className="ceo-kpi-grid">
          <div className="ceo-kpi-card ceo-kpi-card--warn">
            <span className="ceo-kpi-label">Posts pendientes</span>
            <strong className="ceo-kpi-value">{marketing.pendingCount}</strong>
            {marketing.pendingCount > 0 && (
              <Link href="/marketing/pending" className="ceo-kpi-link">
                Aprobar →
              </Link>
            )}
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">Aprobados</span>
            <strong className="ceo-kpi-value">{marketing.approvedCount}</strong>
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">Publicados</span>
            <strong className="ceo-kpi-value">{marketing.publishedCount}</strong>
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">Leads web (24 h)</span>
            <strong className="ceo-kpi-value">{marketing.newLeads24h}</strong>
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">Impresiones (24 h)</span>
            <strong className="ceo-kpi-value">{marketing.impressions24h}</strong>
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">Engagement (7 días)</span>
            <strong className="ceo-kpi-value">{marketing.engagementRate}%</strong>
          </div>
        </div>
        <p className="muted">
          <Link href="/marketing" className="text-link">
            Ir al módulo de marketing →
          </Link>
        </p>
      </section>
    </div>
  );
}
