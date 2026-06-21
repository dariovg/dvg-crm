import { getAuthSession } from "@/lib/auth-server";
import {
  contactScope,
  taskScope,
  isStaff,
  quoteScope,
  canAccessTasksCalendar,
  isCommercial,
} from "@/lib/permissions";
import { loadDashboardStats } from "@/lib/dashboard-stats";
import { getServerLocale } from "@/lib/locale-server";
import DashboardView from "@/components/DashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getAuthSession();
  const locale = await getServerLocale();
  const scope = contactScope(session);
  const staff = isStaff(session);
  const showTasks = canAccessTasksCalendar(session);
  const commercial = isCommercial(session);
  const taskWhere = showTasks ? { ...taskScope(session), done: false } : { id: "__none__" };
  const taskScopeWhere = showTasks ? taskScope(session) : { id: "__none__" };
  const qScope = quoteScope(session);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const data = await loadDashboardStats({
    scope,
    qScope,
    taskWhere,
    taskScopeWhere,
    showTasks,
    weekAgo,
    staff,
  });

  return (
    <div className="page-pad dash-page">
      <DashboardView
        locale={locale}
        stats={data.stats}
        recent={data.recent}
        funnel={data.funnel}
        isStaff={staff}
        showTasks={showTasks}
        isCommercial={commercial}
        teamCount={data.teamCount}
        weekly={data.weekly}
        quoteStats={data.quoteStats}
        taskReminders={data.taskReminders}
      />
    </div>
  );
}
