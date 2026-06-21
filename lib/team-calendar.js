import { prisma } from "./prisma";
import { pushNotification } from "./notifications";

export const EVENT_CATEGORIES = {
  TRAINING: { label: "Formación", short: "Formación" },
  ANNOUNCEMENT: { label: "Novedad / aviso", short: "Aviso" },
  MEETING: { label: "Reunión interna", short: "Reunión" },
  NOVELTY: { label: "Novedad", short: "Novedad" },
  OTHER: { label: "Otro", short: "Otro" },
};

export const EVENT_AUDIENCES = {
  ALL: { label: "Todo el equipo" },
  SALES: { label: "Equipo comercial (Admin, Manager, Comercial)" },
  MARKETING: { label: "Marketing" },
  ADMINS: { label: "Solo administración" },
};

export function audienceRoles(audience) {
  switch (audience) {
    case "SALES":
      return ["ADMIN", "MANAGER", "MEMBER", "COMMERCIAL"];
    case "MARKETING":
      return ["ADMIN", "MARKETING"];
    case "ADMINS":
      return ["ADMIN"];
    default:
      return ["ADMIN", "MANAGER", "MEMBER", "COMMERCIAL", "MARKETING"];
  }
}

export function canSeeTeamEvent(session, event) {
  if (!session?.user?.role) return false;
  return audienceRoles(event.audience).includes(session.user.role);
}

export function formatEventWhen(startsAt, endsAt) {
  const start = new Date(startsAt);
  const date = start.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = start.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (!endsAt) return `${date} · ${time}`;
  const end = new Date(endsAt);
  const endTime = end.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}–${endTime}`;
}

export async function notifyTeamCalendarEvent(event, { actorId, isUpdate = false } = {}) {
  const roles = audienceRoles(event.audience);
  const users = await prisma.user.findMany({
    where: { role: { in: roles } },
    select: { id: true },
  });

  const when = formatEventWhen(event.startsAt, event.endsAt);
  const title = isUpdate
    ? `Calendario actualizado: ${event.title}`
    : `Nuevo evento: ${event.title}`;
  const body = [when, event.location].filter(Boolean).join(" · ");

  let sent = 0;
  for (const user of users) {
    if (user.id === actorId) continue;
    await pushNotification(user.id, {
      type: "calendar_event",
      title,
      body: body || null,
      link: "/calendar",
    });
    sent++;
  }
  return sent;
}

/** Recordatorios ~24 h antes del evento. */
export async function sendCalendarEventReminders() {
  const now = new Date();
  const target = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const windowStart = new Date(target.getTime() - 45 * 60 * 1000);
  const windowEnd = new Date(target.getTime() + 45 * 60 * 1000);

  const events = await prisma.teamCalendarEvent.findMany({
    where: {
      startsAt: { gte: windowStart, lte: windowEnd },
      reminderSentAt: null,
    },
  });

  let reminders = 0;
  for (const event of events) {
    const roles = audienceRoles(event.audience);
    const users = await prisma.user.findMany({
      where: { role: { in: roles } },
      select: { id: true },
    });
    const when = formatEventWhen(event.startsAt, event.endsAt);
    for (const user of users) {
      await pushNotification(user.id, {
        type: "calendar_reminder",
        title: `Mañana: ${event.title}`,
        body: when,
        link: "/calendar",
      });
      reminders++;
    }
    await prisma.teamCalendarEvent.update({
      where: { id: event.id },
      data: { reminderSentAt: new Date() },
    });
  }

  return { events: events.length, reminders };
}

export function parseMeetingDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, mo, d] = s.split("-").map(Number);
    return new Date(y, mo - 1, d);
  }
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(s)) {
    const parts = s.split(/[\/\-]/).map(Number);
    const [d, mo, y] = parts;
    return new Date(y, mo - 1, d);
  }
  return null;
}
