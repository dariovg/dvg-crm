import { getLastActivityDate } from "./activity-utils";

/**
 * @param {import("@prisma/client").PrismaClient} prisma
 * @param {object} scope - Prisma where for contacts
 * @param {number} thresholdDays
 */
export async function getInactiveLeads(prisma, scope, thresholdDays = 7) {
  const cutoff = Date.now() - thresholdDays * 86400000;

  const contacts = await prisma.contact.findMany({
    where: {
      ...scope,
      status: { notIn: ["WON", "LOST"] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      assigneeId: true,
      updatedAt: true,
      createdAt: true,
      assignee: { select: { id: true, name: true, email: true } },
      events: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      tasks: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { updatedAt: true, createdAt: true },
      },
      meetings: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      surveys: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      quotes: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
    orderBy: { updatedAt: "asc" },
    take: 50,
  });

  return contacts
    .map((contact) => {
      const lastAt = getLastActivityDate(contact);
      const lastMs = lastAt ? lastAt.getTime() : contact.createdAt.getTime();
      const daysSince = Math.floor((Date.now() - lastMs) / 86400000);
      return { ...contact, lastActivityAt: lastAt || contact.createdAt, daysSince };
    })
    .filter((c) => {
      const lastMs = c.lastActivityAt.getTime();
      return lastMs < cutoff;
    })
    .sort((a, b) => b.daysSince - a.daysSince);
}
