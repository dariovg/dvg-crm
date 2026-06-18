import { prisma } from "@/lib/prisma";
import { getAuthSession, listTeamUsers } from "@/lib/auth-server";
import { taskScope, isAdmin } from "@/lib/permissions";
import TaskList from "@/components/TaskList";

export default async function TasksPage() {
  const session = await getAuthSession();
  const admin = isAdmin(session);
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
    admin ? listTeamUsers() : Promise.resolve([]),
  ]);

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <>
      <h1 className="page-title">Tareas</h1>
      <p className="page-lead">
        {pending.length} pendientes · {done.length} completadas
        {admin ? " · Vista global" : " · Asignadas a ti"}
      </p>
      <TaskList tasks={tasks} team={team} isAdmin={admin} />
    </>
  );
}
