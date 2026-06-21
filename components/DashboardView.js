"use client";

import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import TaskRemindersBanner from "@/components/TaskRemindersBanner";
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
  weekly,
  quoteStats,
  taskReminders,
}) {
  const { locale, t } = useLocale();

  const subtitle = isStaff
    ? t("dashboard.subtitleStaff", { count: teamCount })
    : isCommercial
      ? t("dashboard.subtitleCommercial")
      : t("dashboard.subtitleMember");

  const quickLinks = QUICK_LINKS.filter((link) => {
    if (link.tasksOnly && !showTasks) return false;
    return true;
  });

  return (
    <>
      <header className="page-head dash-page-head">
        <div>
          <h1>{t("dashboard.title")}</h1>
          <p className="page-sub">{subtitle}</p>
        </div>
        <div className="dash-head-actions">
          <Link href="/leads" prefetch={false} className="btn-primary">
            {t("dashboard.viewLeads")}
          </Link>
          <Link href="/presupuestos/nuevo" prefetch={false} className="btn-secondary">
            {t("dashboard.newQuote")}
          </Link>
        </div>
      </header>

      <nav className="dash-quick-nav" aria-label={t("dashboard.quickActions")}>
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} prefetch={false} className="dash-quick-link">
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
              <Link href="/presupuestos" prefetch={false} className="ceo-kpi-link">
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
                prefetch={false}
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
                <Link href="/tasks" prefetch={false} className="ceo-kpi-link">
                  {t("common.go")}
                </Link>
              )}
            </div>
          )}
          {isStaff && stats.unassigned > 0 && (
            <div className="ceo-kpi-card ceo-kpi-card--warn">
              <span className="ceo-kpi-label">{t("dashboard.kpi.unassigned")}</span>
              <strong className="ceo-kpi-value">{stats.unassigned}</strong>
              <Link href="/leads" prefetch={false} className="ceo-kpi-link">
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

      <div className="panel dash-recent">
        <h2 className="panel-title">{t("dashboard.recentLeads")}</h2>
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
            title={t("dashboard.emptyLeads")}
            description={t("dashboard.emptyLeadsDesc")}
            actionLabel={t("dashboard.viewLeads")}
            actionHref="/leads"
          />
        )}
      </div>
    </>
  );
}
