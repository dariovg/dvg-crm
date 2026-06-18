import { prisma } from "@/lib/prisma";
import { getAuthSession, listTeamUsers } from "@/lib/auth-server";
import { taskScope, isStaff } from "@/lib/permissions";
import { taskDueStatus } from "@/lib/crm-utils";
import TaskList from "@/components/TaskList";

export default async function TasksPage() {
  const session = await getAuthSession();
  const staff = isStaff(session);
  const scope = taskScope(session);

  const [tasks, team] = await Promise.all([
    prisma.task.findMany({
      where: scope,
      orderBy: [{ done: "asc" }, { dueAt: "asc" }],
      include: {
        contact: true,
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
    <>
      <h1 className="page-title">Tareas</h1>
      <p className="page-lead">
        {pending.length} pendientes · {done.length} completadas
        {staff ? " · Vista global" : " · Asignadas a ti"}
      </p>

      {overdue.length > 0 && (
        <>
          <h2 className="section-title section-title--danger">
            Vencidas ({overdue.length})
          </h2>
          <TaskList tasks={overdue} team={team} isAdmin={staff} />
        </>
      )}
      {dueToday.length > 0 && (
        <>
          <h2 className="section-title section-title--warn">
            Vencen hoy ({dueToday.length})
          </h2>
          <TaskList tasks={dueToday} team={team} isAdmin={staff} />
        </>
      )}
      {other.length > 0 && (
        <>
          <h2 className="section-title">Próximas ({other.length})</h2>
          <TaskList tasks={other} team={team} isAdmin={staff} />
        </>
      )}
      {done.length > 0 && (
        <>
          <h2 className="section-title">Completadas ({done.length})</h2>
          <TaskList tasks={done} team={team} isAdmin={staff} />
        </>
      )}
      {!tasks.length && <TaskList tasks={[]} team={team} isAdmin={staff} />}
    </>
  );
}
