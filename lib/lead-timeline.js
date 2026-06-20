import { isNearSameTime } from "./activity-utils";

const EVENT_KIND = {
  created_manual: "lead",
  lead_created: "lead",
  lead_assigned: "lead",
  status_changed: "status",
  details_updated: "note",
  profile_updated: "note",
  assigned: "assign",
  duplicate_detected: "system",
  survey_completed: "survey",
  quote_created: "quote",
  quote_pending: "quote",
  quote_approved: "quote",
  quote_rejected: "quote",
  quote_sent: "quote",
  quote_accepted: "quote",
  task_created: "task",
  task_completed: "task",
  email_sent: "email",
  meeting_booked: "meeting",
};

const KIND_LABEL = {
  lead: "Lead",
  status: "Estado",
  note: "Nota",
  assign: "Asignación",
  system: "Sistema",
  survey: "Encuesta",
  quote: "Presupuesto",
  meeting: "Cita",
  task: "Tarea",
  email: "Email",
};

const EVENT_TITLE = {
  created_manual: "Lead creado",
  lead_created: "Lead registrado",
  lead_assigned: "Lead asignado",
  status_changed: "Cambio de estado",
  details_updated: "Datos actualizados",
  profile_updated: "Datos de contacto actualizados",
  assigned: "Asignación",
  duplicate_detected: "Duplicado detectado",
  survey_completed: "Encuesta completada",
  quote_created: "Presupuesto creado",
  quote_pending: "Presupuesto pendiente",
  quote_approved: "Presupuesto aprobado",
  quote_rejected: "Presupuesto rechazado",
  quote_sent: "Presupuesto enviado",
  quote_accepted: "Presupuesto aceptado",
  task_created: "Tarea creada",
  task_completed: "Tarea completada",
  email_sent: "Email enviado",
  meeting_booked: "Cita agendada",
};

export const TIMELINE_KINDS = Object.entries(KIND_LABEL).map(([id, label]) => ({
  id,
  label,
}));

function quoteLinkFromEvent(ev, quotes) {
  if (!ev.type?.startsWith("quote_") || !quotes?.length) return null;
  const match = ev.summary?.match(/Presupuesto\s+(\S+)/i);
  if (!match) return null;
  const quote = quotes.find((q) => q.number === match[1]);
  return quote ? `/presupuestos/${quote.id}` : null;
}

function hasCreationEvent(events) {
  return (events || []).some((ev) =>
    ["created_manual", "lead_created", "lead_assigned"].includes(ev.type)
  );
}

function surveyEventTimes(events) {
  return (events || [])
    .filter((ev) => ev.type === "survey_completed")
    .map((ev) => ev.createdAt);
}

function taskIdsWithEvents(events) {
  const ids = new Set();
  for (const ev of events || []) {
    if (ev.type === "task_created" || ev.type === "task_completed") {
      const taskId = ev.payload?.taskId;
      if (taskId) ids.add(taskId);
    }
  }
  return ids;
}

function taskIdsCompletedViaEvents(events) {
  const ids = new Set();
  for (const ev of events || []) {
    if (ev.type === "task_completed") {
      const taskId = ev.payload?.taskId;
      if (taskId) ids.add(taskId);
    }
  }
  return ids;
}

/**
 * @param {import("@prisma/client").Contact & {
 *   events: Array<{ id: string; createdAt: Date; type: string; summary: string; payload?: object | null; user?: { name?: string | null } | null }>;
 *   meetings: Array<{ id: string; createdAt: Date; date: string; time: string; meetUrl?: string | null; notes?: string | null }>;
 *   tasks: Array<{ id: string; createdAt: Date; updatedAt: Date; title: string; done: boolean; assignee?: { name?: string | null } | null }>;
 *   surveys: Array<{ id: string; createdAt: Date; score?: number | null }>;
 *   quotes: Array<{ id: string; createdAt: Date; number: string; status: string; approvedAt?: Date | null; sentAt?: Date | null }>;
 * }} contact
 */
export function buildLeadTimeline(contact) {
  const items = [];
  const events = contact.events || [];
  const surveyTimes = surveyEventTimes(events);
  const taskWithEvents = taskIdsWithEvents(events);
  const taskCompletedViaEvents = taskIdsCompletedViaEvents(events);

  if (!hasCreationEvent(events)) {
    items.push({
      id: `lead-created-${contact.id}`,
      at: contact.createdAt,
      kind: "lead",
      title: "Lead registrado",
      summary: `Alta en el CRM (${contact.source})`,
      actor: contact.createdBy?.name || null,
    });
  }

  for (const ev of events) {
    const quoteLink = quoteLinkFromEvent(ev, contact.quotes);
    items.push({
      id: `event-${ev.id}`,
      at: ev.createdAt,
      kind: EVENT_KIND[ev.type] || "note",
      title: EVENT_TITLE[ev.type] || KIND_LABEL[EVENT_KIND[ev.type]] || "Actividad",
      summary: ev.summary,
      actor: ev.user?.name || null,
      link: quoteLink,
      linkLabel: quoteLink ? "Ver presupuesto" : null,
      meta: { eventType: ev.type, taskId: ev.payload?.taskId },
    });
  }

  for (const m of contact.meetings || []) {
    const hasMeetingEvent = events.some(
      (ev) =>
        ev.type === "meeting_booked" &&
        isNearSameTime(ev.createdAt, m.createdAt)
    );
    if (hasMeetingEvent) continue;

    const parts = [m.date, m.time].filter(Boolean).join(" · ");
    items.push({
      id: `meeting-${m.id}`,
      at: m.createdAt,
      kind: "meeting",
      title: "Cita agendada",
      summary: parts,
      detail: m.notes || null,
      link: m.meetUrl || null,
      linkLabel: m.meetUrl ? "Google Meet" : null,
      external: !!m.meetUrl,
    });
  }

  for (const t of contact.tasks || []) {
    if (!taskWithEvents.has(t.id)) {
      items.push({
        id: `task-created-${t.id}`,
        at: t.createdAt,
        kind: "task",
        title: "Tarea creada",
        summary: t.title,
        actor: t.assignee?.name || null,
        meta: { taskId: t.id, done: t.done },
      });
    }
    if (
      t.done &&
      t.updatedAt > t.createdAt &&
      !taskCompletedViaEvents.has(t.id)
    ) {
      items.push({
        id: `task-done-${t.id}`,
        at: t.updatedAt,
        kind: "task",
        title: "Tarea completada",
        summary: t.title,
        actor: t.assignee?.name || null,
        meta: { taskId: t.id, done: true },
      });
    }
  }

  for (const s of contact.surveys || []) {
    const duplicated = surveyTimes.some((at) => isNearSameTime(at, s.createdAt));
    if (duplicated) continue;

    items.push({
      id: `survey-${s.id}`,
      at: s.createdAt,
      kind: "survey",
      title: "Encuesta respondida",
      summary: s.score != null ? `Puntuación: ${s.score}` : "Respuestas recibidas",
    });
  }

  items.sort((a, b) => b.at.getTime() - a.at.getTime());

  return items;
}

/** @param {ReturnType<typeof buildLeadTimeline>} items */
export function filterTimelineByKind(items, kind) {
  if (!kind || kind === "all") return items;
  return items.filter((item) => item.kind === kind);
}

/**
 * @param {Array<object & { id: string; name: string }>} contacts
 * @param {number} [perContact=5]
 */
export function buildActivityFeed(contacts, perContact = 5) {
  const all = [];
  for (const contact of contacts) {
    const timeline = buildLeadTimeline(contact);
    for (const item of timeline.slice(0, perContact)) {
      all.push({
        ...item,
        contactId: contact.id,
        contactName: contact.name,
      });
    }
  }
  all.sort((a, b) => b.at.getTime() - a.at.getTime());
  return all;
}

export { KIND_LABEL };
