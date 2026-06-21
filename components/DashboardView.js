"use client";

import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import TaskRemindersBanner from "@/components/TaskRemindersBanner";
import InactivityBanner from "@/components/InactivityBanner";
import RecentActivityFeed from "@/components/RecentActivityFeed";
import Accordion from "@/components/Accordion";
import { useLocale } from "@/components/LocaleProvider";
import { navLabel } from "@/lib/i18n";
import { formatEuro } from "@/lib/pricing-catalog";

const QUICK_LINKS = [
  { href: "/leads", key: "/leads" },
  { href: "/pipeline", key: "/pipeline" },
  { href: "/presupuestos", key: "/presupuestos" },
  { href: "/tasks", key: "/tasks", tasksOnly: true },
  { href: "/presupuestos/nuevo", key: "newQuote", newQuote: true },
];

export default function DashboardView({
  stats,
  recent,
  isStaff,
  showTasks,
  isCommercial,
  teamCount,
  memberStats,
  funnel,
  weekly,
  quoteStats,
  stageDurations,
  taskReminders,
  recentActivity,
  inactiveLeads,
  inactivityDays,
}) {
  const { locale, t } = useLocale();

  const subtitle = isStaff
    ? t("dashboard.subtitleStaff", { count: teamCount })
    : isCommercial
      ? t("dashboard.subtitleCommercial")
      : t("dashboard.subtitleMember");

  const maxPipeline = Math.max(...stats.byStatus.map((s) => s.count), 1);
  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);
  const maxStage = Math.max(...(stageDurations || []).map((s) => s.avgDays), 1);

  const quickLinks = QUICK_LINKS.filter((link) => {
    if (link.tasksOnly && !showTasks) return false;
    return true;
  });

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
    <div className="page-pad dash-page">
      <header className="page-head dash-page-head">
        <div>
          <h1>{t("dashboard.title")}</h1>
          <p className="page-sub">{subtitle}</p>
        </div>
        <div className="dash-head-actions">
          <Link href="/leads" className="btn-primary">
            {t("dashboard.viewLeads")}
          </Link>
          <Link href="/presupuestos/nuevo" className="btn-secondary">
            {t("dashboard.newQuote")}
          </Link>
        </div>
      </header>

      <nav className="dash-quick-nav" aria-label={t("dashboard.quickActions")}>
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} className="dash-quick-link">
            {link.newQuote ? t("dashboard.newQuote") : navLabel(link.key, locale)}
          </Link>
        ))}
      </nav>

      {taskReminders && (
        <TaskRemindersBanner
          overdue={taskReminders.overdue}
          dueToday={taskReminders.dueToday}
        />
      )}

      {inactiveLeads?.length > 0 && (
        <InactivityBanner leads={inactiveLeads} thresholdDays={inactivityDays} />
      )}

      <section className="dash-kpi-section" aria-label="KPIs">
        <div className="ceo-kpi-grid dash-kpi-grid">
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">{t("dashboard.kpi.contacts")}</span>
            <strong className="ceo-kpi-value">{stats.total}</strong>
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">{t("dashboard.kpi.new")}</span>
            <strong className="ceo-kpi-value">{stats.newCount}</strong>
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">{t("dashboard.kpi.won")}</span>
            <strong className="ceo-kpi-value">{stats.wonCount}</strong>
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">{t("dashboard.kpi.pipelineValue")}</span>
            <strong className="ceo-kpi-value">
              {formatEuro(stats.dealValueTotal)}
            </strong>
          </div>
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">{t("dashboard.kpi.openQuotes")}</span>
            <strong className="ceo-kpi-value">{quoteStats?.open ?? 0}</strong>
            {(quoteStats?.open ?? 0) > 0 && (
              <Link href="/presupuestos" className="ceo-kpi-link">
                {t("common.go")}
              </Link>
            )}
          </div>
          {(quoteStats?.pending ?? 0) > 0 && (
            <div className="ceo-kpi-card ceo-kpi-card--warn">
              <span className="ceo-kpi-label">{t("dashboard.kpi.pendingQuotes")}</span>
              <strong className="ceo-kpi-value">{quoteStats.pending}</strong>
              <Link
                href="/presupuestos?status=PENDING_APPROVAL"
                className="ceo-kpi-link"
              >
                {t("dashboard.kpi.review")}
              </Link>
            </div>
          )}
          {showTasks && (
            <div className="ceo-kpi-card">
              <span className="ceo-kpi-label">{t("dashboard.kpi.tasks")}</span>
              <strong className="ceo-kpi-value">{stats.pendingTasks}</strong>
              {stats.pendingTasks > 0 && (
                <Link href="/tasks" className="ceo-kpi-link">
                  {t("common.go")}
                </Link>
              )}
            </div>
          )}
          {isStaff && stats.unassigned > 0 && (
            <div className="ceo-kpi-card ceo-kpi-card--warn">
              <span className="ceo-kpi-label">{t("dashboard.kpi.unassigned")}</span>
              <strong className="ceo-kpi-value">{stats.unassigned}</strong>
              <Link href="/leads" className="ceo-kpi-link">
                {t("dashboard.kpi.review")}
              </Link>
            </div>
          )}
        </div>
      </section>

      <Accordion title={t("dashboard.moreMetrics")} subtitle={t("dashboard.moreMetricsSub")}>
        <div className="ceo-kpi-grid">
          <div className="ceo-kpi-card">
            <span className="ceo-kpi-label">{t("dashboard.kpi.meetings")}</span>
            <strong className="ceo-kpi-value">{stats.meetingCount}</strong>
          </div>
          {isStaff && (
            <div className="ceo-kpi-card">
              <span className="ceo-kpi-label">{t("dashboard.kpi.unassigned")}</span>
              <strong className="ceo-kpi-value">{stats.unassigned}</strong>
            </div>
          )}
        </div>
      </Accordion>

      {weekly && (
        <section className="dash-weekly">
          <h2 className="panel-title">{t("dashboard.thisWeek")}</h2>
          <div className="dash-weekly-grid">
            <div className="dash-weekly-card">
              <strong>{weekly.newLeads}</strong>
              <span>{t("dashboard.week.newLeads")}</span>
            </div>
            <div className="dash-weekly-card">
              <strong>{weekly.statusChanges}</strong>
              <span>{t("dashboard.week.statusChanges")}</span>
            </div>
            {showTasks && (
              <div className="dash-weekly-card">
                <strong>{weekly.tasksDone}</strong>
                <span>{t("dashboard.week.tasksDone")}</span>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="dash-grid dash-grid--activity">
        <div className="panel dash-recent">
          <h2 className="panel-title">{t("dashboard.recentLeads")}</h2>
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
              title={t("dashboard.emptyLeads")}
              description={t("dashboard.emptyLeadsDesc")}
              actionLabel={t("dashboard.viewLeads")}
              actionHref="/leads"
            />
          )}
        </div>

        <div className="panel dash-activity">
          <h2 className="panel-title">{t("dashboard.recentActivity")}</h2>
          <RecentActivityFeed items={recentActivity} />
        </div>
      </div>

      <Accordion
        title={t("dashboard.funnelPipeline")}
        subtitle={t("dashboard.funnelPipelineSub")}
        badge={stats.total}
      >
        <div className="dash-grid">
          <div className="dash-pipeline-chart">
            <h3 className="dash-subtitle">{t("dashboard.funnel")}</h3>
            {funnelChart}
          </div>
          <div className="dash-pipeline-chart">
            <h3 className="dash-subtitle">{t("dashboard.pipeline")}</h3>
            {pipelineChart}
          </div>
        </div>
      </Accordion>

      {stageDurations?.length > 0 && (
        <Accordion
          title={t("dashboard.stageTimes")}
          subtitle={t("dashboard.stageTimesSub")}
        >
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
          title={t("dashboard.team")}
          subtitle={t("dashboard.teamSub")}
          badge={memberStats.length}
        >
          <div className="member-stats-grid">
            {memberStats.map((m) => (
              <div key={m.id} className="member-stat">
                <strong>{m.name}</strong>
                <span>{t("dashboard.memberAssigned", { count: m.assigned })}</span>
                <span>{t("dashboard.memberWon", { count: m.won })}</span>
                <span>{t("dashboard.memberTasks", { count: m.pendingTasks })}</span>
              </div>
            ))}
          </div>
        </Accordion>
      )}
    </div>
  );
}
