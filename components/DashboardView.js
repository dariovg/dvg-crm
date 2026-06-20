import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import TaskRemindersBanner from "@/components/TaskRemindersBanner";
import InactivityBanner from "@/components/InactivityBanner";
import RecentActivityFeed from "@/components/RecentActivityFeed";
import Accordion from "@/components/Accordion";

export default function DashboardView({
  stats,
  recent,
  isStaff,
  teamCount,
  memberStats,
  funnel,
  weekly,
  stageDurations,
  taskReminders,
  recentActivity,
  inactiveLeads,
  inactivityDays,
}) {
  const maxPipeline = Math.max(...stats.byStatus.map((s) => s.count), 1);
  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);
  const maxStage = Math.max(...(stageDurations || []).map((s) => s.avgDays), 1);

  const funnelChart = (
    <ul className="funnel-list">
      {funnel.map((f, i) => {
        const prev = i > 0 ? funnel[i - 1].count : null;
        const rate =
          prev && prev > 0 ? Math.round((f.count / prev) * 100) : null;
        return (
          <li key={f.id} className="funnel-step">
            <span className="funnel-label">{f.label}</span>
            <div className="funnel-bar-track">
              <div
                className="funnel-bar-fill"
                data-status={f.id}
                style={{ width: `${(f.count / maxFunnel) * 100}%` }}
              />
            </div>
            <span className="funnel-num">{f.count}</span>
            {rate != null && <span className="funnel-rate">{rate}%</span>}
          </li>
        );
      })}
    </ul>
  );

  const pipelineChart = (
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
  );

  return (
    <>
      <header className="dash-header">
        <div>
          <h1 className="page-title">Resumen</h1>
          <p className="page-lead">
            {isStaff
              ? `Vista global · ${teamCount} en el equipo`
              : "Tus leads y tareas asignadas"}
          </p>
        </div>
        <Link href="/leads" className="btn-primary dash-cta">
          Ver leads
        </Link>
      </header>

      {taskReminders && (
        <TaskRemindersBanner
          overdue={taskReminders.overdue}
          dueToday={taskReminders.dueToday}
        />
      )}

      {inactiveLeads?.length > 0 && (
        <InactivityBanner leads={inactiveLeads} thresholdDays={inactivityDays} />
      )}

      <div className="dash-kpis dash-kpis--primary">
        <div className="dash-kpi dash-kpi--accent">
          <span className="dash-kpi-value">{stats.total}</span>
          <span className="dash-kpi-label">Contactos</span>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi-value">{stats.newCount}</span>
          <span className="dash-kpi-label">Nuevos</span>
        </div>
        <div className="dash-kpi dash-kpi--success">
          <span className="dash-kpi-value">{stats.wonCount}</span>
          <span className="dash-kpi-label">Clientes</span>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi-value">{stats.pendingTasks}</span>
          <span className="dash-kpi-label">Tareas pendientes</span>
        </div>
      </div>

      <Accordion title="Más métricas" subtitle="Reuniones, valor y asignación">
        <div className="dash-kpis dash-kpis--secondary">
          <div className="dash-kpi">
            <span className="dash-kpi-value">{stats.meetingCount}</span>
            <span className="dash-kpi-label">Reuniones</span>
          </div>
          <div className="dash-kpi dash-kpi--secondary">
            <span className="dash-kpi-value">{stats.dealValueTotal} €</span>
            <span className="dash-kpi-label">Pipeline (valor)</span>
          </div>
          {isStaff && (
            <div className="dash-kpi dash-kpi--warn">
              <span className="dash-kpi-value">{stats.unassigned}</span>
              <span className="dash-kpi-label">Sin asignar</span>
            </div>
          )}
        </div>
      </Accordion>

      {weekly && (
        <div className="card weekly-strip">
          <h2>Esta semana</h2>
          <div className="weekly-stats">
            <div>
              <strong>{weekly.newLeads}</strong>
              <span>Leads nuevos</span>
            </div>
            <div>
              <strong>{weekly.statusChanges}</strong>
              <span>Cambios de estado</span>
            </div>
            <div>
              <strong>{weekly.tasksDone}</strong>
              <span>Tareas hechas</span>
            </div>
          </div>
        </div>
      )}

      <div className="dash-grid dash-grid--activity">
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
          {!recent.length && (
            <EmptyState
              icon="leads"
              title="Sin actividad reciente"
              description="Los leads nuevos aparecerán aquí."
              actionLabel="Ver leads"
              actionHref="/leads"
            />
          )}
        </div>

        <div className="card dash-activity">
          <h2>Actividad reciente</h2>
          <RecentActivityFeed items={recentActivity} />
        </div>
      </div>

      <Accordion
        title="Embudo y pipeline"
        subtitle="Conversión y distribución por estado"
        badge={stats.total}
      >
        <div className="dash-grid">
          <div className="dash-pipeline-chart">
            <h3 className="dash-subtitle">Embudo de conversión</h3>
            {funnelChart}
          </div>
          <div className="dash-pipeline-chart">
            <h3 className="dash-subtitle">Pipeline</h3>
            {pipelineChart}
          </div>
        </div>
      </Accordion>

      {stageDurations?.length > 0 && (
        <Accordion title="Tiempos por etapa" subtitle="Media de días en cada fase">
          <ul className="pipeline-bars">
            {stageDurations.map((s) => (
              <li key={s.id}>
                <span className="pipeline-bars-label">{s.label}</span>
                <div className="pipeline-bars-track">
                  <div
                    className="pipeline-bars-fill"
                    data-status={s.id}
                    style={{ width: `${(s.avgDays / maxStage) * 100}%` }}
                  />
                </div>
                <span className="pipeline-bars-num">{s.avgDays} d</span>
              </li>
            ))}
          </ul>
        </Accordion>
      )}

      {isStaff && memberStats?.length > 0 && (
        <Accordion
          title="Equipo"
          subtitle="Rendimiento por miembro"
          badge={memberStats.length}
        >
          <div className="member-stats-grid">
            {memberStats.map((m) => (
              <div key={m.id} className="member-stat">
                <strong>{m.name}</strong>
                <span>{m.assigned} asignados</span>
                <span>{m.won} clientes</span>
                <span>{m.pendingTasks} tareas</span>
              </div>
            ))}
          </div>
        </Accordion>
      )}
    </>
  );
}
