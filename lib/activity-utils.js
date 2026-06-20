const MS_MIN = 60000;

/**
 * @param {import("@prisma/client").Contact & {
 *   events?: Array<{ createdAt: Date }>;
 *   tasks?: Array<{ updatedAt: Date; createdAt: Date }>;
 *   meetings?: Array<{ createdAt: Date }>;
 *   surveys?: Array<{ createdAt: Date }>;
 *   quotes?: Array<{ createdAt: Date; updatedAt?: Date }>;
 * }} contact
 */
export function getLastActivityDate(contact) {
  const dates = [contact.updatedAt, contact.createdAt].filter(Boolean);
  for (const ev of contact.events || []) dates.push(ev.createdAt);
  for (const t of contact.tasks || []) {
    dates.push(t.updatedAt, t.createdAt);
  }
  for (const m of contact.meetings || []) dates.push(m.createdAt);
  for (const s of contact.surveys || []) dates.push(s.createdAt);
  for (const q of contact.quotes || []) {
    dates.push(q.updatedAt || q.createdAt);
  }
  if (!dates.length) return null;
  return new Date(Math.max(...dates.map((d) => new Date(d).getTime())));
}

export function isNearSameTime(a, b, windowMs = 5 * MS_MIN) {
  if (!a || !b) return false;
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) <= windowMs;
}
