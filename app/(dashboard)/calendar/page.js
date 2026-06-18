import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-server";
import { contactScope, taskScope } from "@/lib/permissions";
import CalendarView from "@/components/CalendarView";

export default async function CalendarPage() {
  const session = await getAuthSession();
  const scope = contactScope(session);
  const tScope = taskScope(session);

  const now = new Date();
  const weekStart = new Date(now);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [tasks, meetings] = await Promise.all([
    prisma.task.findMany({
      where: {
        ...tScope,
        dueAt: { gte: weekStart, lt: weekEnd },
      },
      orderBy: { dueAt: "asc" },
      include: { contact: { select: { id: true, name: true } } },
    }),
    prisma.meeting.findMany({
      where: { contact: scope },
      include: { contact: { select: { id: true, name: true } } },
    }),
  ]);

  return (
    <>
      <h1 className="page-title">Calendario</h1>
      <p className="page-lead">Semana actual · tareas y citas</p>
      <CalendarView tasks={tasks} meetings={meetings} />
    </>
  );
}
