import { prisma } from "@/lib/prisma";
import TaskList from "@/components/TaskList";

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ done: "asc" }, { dueAt: "asc" }],
    include: { contact: true },
  });

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <>
      <h1 className="page-title">Tareas</h1>
      <p className="page-lead">
        {pending.length} pendientes · {done.length} completadas
      </p>
      <TaskList tasks={tasks} />
    </>
  );
}
