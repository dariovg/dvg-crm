import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import TaskRemindersBanner from "@/components/TaskRemindersBanner";
import Accordion from "@/components/Accordion";
import { t, navLabel } from "@/lib/i18n";
import { contactStatusLabel } from "@/lib/i18n-labels";

const QUICK_LINKS = [
  { href: "/leads", key: "/leads" },
  { href: "/pipeline", key: "/pipeline" },
  { href: "/presupuestos", key: "/presupuestos" },
  { href: "/tasks", key: "/tasks", tasksOnly: true },
  { href: "/presupuestos/nuevo", key: "newQuote", newQuote: true },
];

export default function DashboardView({
  locale = "es",
  stats,
  recent,
  funnel,
  isStaff,
  showTasks,
  isCommercial,
  teamCount,
  weekly,
  quoteStats,
  taskReminders,
}) {
  const subtitle = isStaff
    ? t("dashboard.subtitleStaff", locale, { count: teamCount })
    : isCommercial
      ? t("dashboard.subtitleCommercial", locale)
      : t("dashboard.subtitleMember", locale);

  const quickLinks = QUICK_LINKS.filter((link) => {
    if (link.tasksOnly && !showTasks) return false;
    return true;
  });

  const maxPipeline = Math.max(...stats.byStatus.map((s) => s.count), 1);
  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <>
      <header className="page-head dash-page-head">
        <div>
          <h1>{t("dashboard.title", locale)}</h1>
          <p className="page-sub">{subtitle}</p>
        </div>
        <div className="dash-head-actions">
          <Link href="/leads" prefetch={false} className="btn-primary">
            {t("dashboard.viewLeads", locale)}
          </Link>
          <Link href="/presupuestos/nuevo" prefetch={false} className="btn-secondary">
            {t("dashboard.newQuote", locale)}
          </Link>
        </div>
      </header>

      <nav className="dash-quick-nav" aria-label={t("dashboard.quickActions", locale)}>
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} prefetch={false} className="dash-quick-link">
            {link.newQuote ? t("dashboard.newQuote", locale) : navLabel(link.key, locale)}
          </Link>
        ))}
      </nav>

      {taskReminders && (
        <TaskRemindersBanner
          overdue={taskReminders.overdue}
          dueToday={taskReminders.dueToday}
        />
      )}

      <section className="dash-kpi-section" aria-label="KPIs">
        <div className="ceo-kpi-grid dash-kpi-grid">
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">{t("dashboard.kpi.contacts", locale)}</span>
            <strong className="ceo-kpi-value">{stats.total}</strong>
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">{t("dashboard.kpi.new", locale)}</span>
            <strong className="ceo-kpi-value">{stats.newCount}</strong>
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">{t("dashboard.kpi.won", locale)}</span>
            <strong className="ceo-kpi-value">{stats.wonCount}</strong>
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">{t("dashboard.kpi.pipelineValue", locale)}</span>
            <strong className="ceo-kpi-value">
              {formatEuro(stats.dealValueTotal, locale)}
            </strong>
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">{t("dashboard.kpi.openQuotes", locale)}</span>
            <strong className="ceo-kpi-value">{quoteStats?.open ?? 0}</strong>
          </div>
          {showTasks && (
            <div className="ceo-kpi-card">
              <span className="ceo-kpi-label">{t("dashboard.kpi.tasks", locale)}</span>
              <strong className="ceo-kpi-value">{stats.pendingTasks}</strong>
            </div>
          )}
        </div>
      </section>

      {weekly && (
        <section className="dash-weekly">
          <h2 className="panel-title">{t("dashboard.thisWeek", locale)}</h2>
          <div className="dash-weekly-grid">
            <div className="dash-weekly-card">
              <strong>{weekly.newLeads}</strong>
              <span>{t("dashboard.week.newLeads", locale)}</span>
            </div>
            <div className="dash-weekly-card">
              <strong>{weekly.statusChanges}</strong>
              <span>{t("dashboard.week.statusChanges", locale)}</span>
            </div>
            {showTasks && (
              <div className="dash-weekly-card">
                <strong>{weekly.tasksDone}</strong>
                <span>{t("dashboard.week.tasksDone", locale)}</span>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="panel dash-recent">
        <h2 className="panel-title">{t("dashboard.recentLeads", locale)}</h2>
        <ul className="dash-recent-list">
          {recent.map((c) => (
            <li key={c.id}>
              <Link href={`/leads/${c.id}`} prefetch={false}>
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
            title={t("dashboard.emptyLeads", locale)}
            description={t("dashboard.emptyLeadsDesc", locale)}
            actionLabel={t("dashboard.viewLeads", locale)}
            actionHref="/leads"
          />
        )}
      </div>

      <Accordion
        title={t("dashboard.funnelPipeline", locale)}
        subtitle={t("dashboard.funnelPipelineSub", locale)}
        badge={stats.total}
      >
        <div className="dash-grid">
          <div className="dash-pipeline-chart">
            <h3 className="dash-subtitle">{t("dashboard.funnel", locale)}</h3>
            <ul className="funnel-list">
              {funnel.map((f, i) => {
                const prev = i > 0 ? funnel[i - 1].count : null;
                const rate =
                  prev && prev > 0 ? Math.round((f.count / prev) * 100) : null;
                return (
                  <li key={f.id} className="funnel-step">
                    <span className="funnel-label">{contactStatusLabel(f.id, locale)}</span>
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
          </div>
          <div className="dash-pipeline-chart">
            <h3 className="dash-subtitle">{t("dashboard.pipeline", locale)}</h3>
            <ul className="pipeline-bars">
              {stats.byStatus
                .filter((s) => s.id !== "LOST")
                .map((s) => (
                  <li key={s.id}>
                    <span className="pipeline-bars-label">{contactStatusLabel(s.id, locale)}</span>
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
        </div>
      </Accordion>
    </>
  );
}

function formatEuro(amount, locale) {
  return `€${Number(amount).toLocaleString(locale === "en" ? "en-GB" : "es-ES")}`;
}