"use client";

import { useLocale } from "@/components/LocaleProvider";
import TaskList from "@/components/TaskList";

export default function TasksPageView({
  overdue,
  dueToday,
  other,
  done,
  team,
  staff,
  pendingCount,
  doneCount,
}) {
  const { t } = useLocale();

  return (
    <>
      <h1 className="page-title">{t("page.tasks.title")}</h1>
      <p className="page-lead">
        {t("page.tasks.subtitle", { pending: pendingCount, done: doneCount })}
        {staff ? ` · ${t("common.viewGlobal")}` : ` · ${t("common.assignedToYouTasks")}`}
      </p>

      {overdue.length > 0 && (
        <>
          <h2 className="section-title section-title--danger">
            {t("page.tasks.overdue", { count: overdue.length })}
          </h2>
          <TaskList tasks={overdue} team={team} isAdmin={staff} />
        </>
      )}
      {dueToday.length > 0 && (
        <>
          <h2 className="section-title section-title--warn">
            {t("page.tasks.dueToday", { count: dueToday.length })}
          </h2>
          <TaskList tasks={dueToday} team={team} isAdmin={staff} />
        </>
      )}
      {other.length > 0 && (
        <>
          <h2 className="section-title">
            {t("page.tasks.upcoming", { count: other.length })}
          </h2>
          <TaskList tasks={other} team={team} isAdmin={staff} />
        </>
      )}
      {done.length > 0 && (
        <>
          <h2 className="section-title">
            {t("page.tasks.doneSection", { count: done.length })}
          </h2>
          <TaskList tasks={done} team={team} isAdmin={staff} />
        </>
      )}
      {!overdue.length && !dueToday.length && !other.length && !done.length && (
        <TaskList tasks={[]} team={team} isAdmin={staff} />
      )}
    </>
  );
}
