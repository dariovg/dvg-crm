import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export default function DashboardView({
  stats,
  recent,
  isAdmin,
  teamCount,
}) {
  const maxPipeline = Math.max(...stats.byStatus.map((s) => s.count), 1);

  return (
    <>
      <header className="dash-header">
        <div>
          <h1 className="page-title">Resumen</h1>
          <p className="page-lead">
            {isAdmin
              ? `Vista global · ${teamCount} en el equipo`
              : "Tus leads y tareas asignadas"}
          </p>
        </div>
        <Link href="/leads" className="btn-primary dash-cta">
          Ver leads
        </Link>
      </header>

      <div className="dash-kpis">
        <div className="dash-kpi dash-kpi--accent">
          <span className="dash-kpi-value">{stats.total}</span>
          <span className="dash-kpi-label">Contactos</span>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi-value">{stats.newCount}</span>
          <span className="dash-kpi-label">Nuevos</span>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi-value">{stats.meetingCount}</span>
          <span className="dash-kpi-label">Reuniones</span>
        </div>
        <div className="dash-kpi dash-kpi--success">
          <span className="dash-kpi-value">{stats.wonCount}</span>
          <span className="dash-kpi-label">Clientes</span>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi-value">{stats.pendingTasks}</span>
          <span className="dash-kpi-label">Tareas pendientes</span>
        </div>
        {isAdmin && (
          <div className="dash-kpi dash-kpi--warn">
            <span className="dash-kpi-value">{stats.unassigned}</span>
            <span className="dash-kpi-label">Sin asignar</span>
          </div>
        )}
      </div>

      <div className="dash-grid">
        <div className="card dash-pipeline-chart">
          <h2>Pipeline</h2>
          <ul className="pipeline-bars">
            {stats.byStatus
              .filter((s) => s.id !== "LOST")
              .map((s) => (
                <li key={s.id}>
                  <span className="pipeline-bars-label">{s.label}</span>
                  <div className="pipeline-bars-track">
                    <div
                      className="pipeline-bars-fill"
                      data-status={s.id}
                      style={{ width: `${(s.count / maxPipeline) * 100}%` }}
                    />
                  </div>
                  <span className="pipeline-bars-num">{s.count}</span>
                </li>
              ))}
          </ul>
        </div>

        <div className="card dash-recent">
          <h2>Últimos leads</h2>
          <ul className="dash-recent-list">
            {recent.map((c) => (
              <li key={c.id}>
                <Link href={`/leads/${c.id}`}>
                  <strong>{c.name}</strong>
                  <span>{c.email}</span>
                </Link>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ul>
          {!recent.length && <p className="empty-state">Aún no hay leads.</p>}
        </div>
      </div>
    </>
  );
}
