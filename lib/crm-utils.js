import { STATUS_LABEL } from "./constants";

const MS_DAY = 86400000;

/** @param {{ createdAt: Date, summary: string }[]} events */
function statusFromSummary(summary) {
  if (summary.startsWith("Perdido:")) return "LOST";
  const m = summary.match(/Estado cambiado a (\w+)/);
  return m ? m[1] : null;
}

/**
 * Promedio de días por etapa a partir de eventos status_changed.
 * @param {{ contactId: string, createdAt: Date, summary: string, contact?: { status: string, createdAt: Date } }[]} events
 */
export function computeStageDurations(events) {
  const byContact = new Map();
  for (const ev of events) {
    if (!byContact.has(ev.contactId)) byContact.set(ev.contactId, []);
    byContact.get(ev.contactId).push(ev);
  }

  const totals = {};
  const counts = {};

  for (const [, list] of byContact) {
    list.sort((a, b) => a.createdAt - b.createdAt);
    let prevStatus = "NEW";
    let prevTime = list[0]?.contact?.createdAt
      ? new Date(list[0].contact.createdAt)
      : new Date(list[0]?.createdAt || Date.now());

    for (const ev of list) {
      const nextStatus = statusFromSummary(ev.summary);
      if (!nextStatus) continue;
      const days = (new Date(ev.createdAt) - prevTime) / MS_DAY;
      if (days >= 0 && prevStatus) {
        totals[prevStatus] = (totals[prevStatus] || 0) + days;
        counts[prevStatus] = (counts[prevStatus] || 0) + 1;
      }
      prevStatus = nextStatus;
      prevTime = new Date(ev.createdAt);
    }

    const currentStatus = list[list.length - 1]?.contact?.status;
    if (currentStatus && prevStatus === currentStatus) {
      const days = (Date.now() - prevTime) / MS_DAY;
      if (days >= 0) {
        totals[currentStatus] = (totals[currentStatus] || 0) + days;
        counts[currentStatus] = (counts[currentStatus] || 0) + 1;
      }
    }
  }

  return Object.keys(STATUS_LABEL)
    .filter((s) => s !== "LOST")
    .map((id) => ({
      id,
      label: STATUS_LABEL[id] || id,
      avgDays:
        counts[id] > 0 ? Math.round((totals[id] / counts[id]) * 10) / 10 : 0,
      samples: counts[id] || 0,
    }))
    .filter((s) => s.samples > 0);
}

export function taskDueStatus(dueAt, done) {
  if (done || !dueAt) return null;
  const due = new Date(dueAt);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  if (startOfDue < startOfToday) return "overdue";
  if (startOfDue.getTime() === startOfToday.getTime()) return "today";
  const tomorrow = new Date(startOfToday);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (startOfDue.getTime() === tomorrow.getTime()) return "tomorrow";
  return null;
}

export function dueLabel(status) {
  if (status === "overdue") return "Vencida";
  if (status === "today") return "Vence hoy";
  if (status === "tomorrow") return "Vence mañana";
  return null;
}
