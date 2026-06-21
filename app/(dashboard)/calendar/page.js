import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-server";
import { contactScope, taskScope, isStaff } from "@/lib/permissions";
import { audienceRoles } from "@/lib/team-calendar";
import CalendarView from "@/components/CalendarView";

function startOfWeekFromParam(weekParam) {
  const base = weekParam ? new Date(`${weekParam}T12:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return startOfWeek(new Date());
  return startOfWeek(base);
}

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default async function CalendarPage({ searchParams }) {
  const params = await searchParams;
  const session = await getAuthSession();
  const scope = contactScope(session);
  const tScope = taskScope(session);
  const role = session?.user?.role;
  const canManage = isStaff(session);

  const weekStart = startOfWeekFromParam(params.week);
  const weekEnd = addDays(weekStart, 7);

  const visibleAudiences = ["ALL", "SALES", "MARKETING", "ADMINS"].filter((aud) =>
    audienceRoles(aud).includes(role)
  );

  const [tasks, meetings, teamEvents] = await Promise.all([
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
    prisma.teamCalendarEvent.findMany({
      where: {
        audience: { in: visibleAudiences },
        startsAt: { gte: weekStart, lt: weekEnd },
      },
      orderBy: { startsAt: "asc" },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return (
    <>
      <h1 className="page-title">Calendario</h1>
      <p className="page-lead">
        Citas con leads, tareas y eventos de equipo · recibirás alertas en la campana
      </p>
      <Suspense fallback={<p>Cargando calendario…</p>}>
        <CalendarView
          tasks={tasks}
          meetings={meetings}
          teamEvents={teamEvents}
          canManage={canManage}
          weekStartIso={weekStart.toISOString()}
        />
      </Suspense>
    </>
  );
}
