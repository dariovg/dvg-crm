import { prisma } from "@/lib/prisma";
import { CONTACT_STATUSES } from "@/lib/constants";
import { getAuthSession, listTeamUsers } from "@/lib/auth-server";
import { taskScope, isStaff } from "@/lib/permissions";
import { taskDueStatus } from "@/lib/crm-utils";
import TasksPageView from "@/components/TasksPageView";

export default async function TasksPage() {
  const session = await getAuthSession();
  const staff = isStaff(session);
  const scope = taskScope(session);

  const [tasks, team] = await Promise.all([
    prisma.task.findMany({
      where: scope,
      orderBy: [{ done: "asc" }, { dueAt: "asc" }],
      include: {
        contact: { select: { id: true, name: true, email: true, status: true } },
        assignee: { select: { id: true, email: true, name: true, role: true } },
      },
    }),
    staff ? listTeamUsers() : Promise.resolve([]),
  ]);

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const overdue = pending.filter((t) => taskDueStatus(t.dueAt, false) === "overdue");
  const dueToday = pending.filter((t) => taskDueStatus(t.dueAt, false) === "today");
  const other = pending.filter(
    (t) => !overdue.includes(t) && !dueToday.includes(t)
  );

  return (
    <TasksPageView
      overdue={overdue}
      dueToday={dueToday}
      other={other}
      done={done}
      team={team}
      staff={staff}
      pendingCount={pending.length}
      doneCount={done.length}
    />
  );
}
