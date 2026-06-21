import { prisma } from "./prisma.js";

export async function pushNotification(userId, { type, title, body, link }) {
  if (!userId || userId === "env-admin") return;
  await prisma.notification.create({
    data: { userId, type, title, body: body || null, link: link || null },
  });
}

/** Notifica al assignee de lead o tarea (salta si es el mismo actor). */
export async function notifyAssignee(actorUserId, assignee, { type, title, link }) {
  if (!assignee?.id) return;
  if (actorUserId && actorUserId === assignee.id) return;

  const notifType = type === "lead" ? "lead_assigned" : "task_assigned";
  const notifTitle =
    type === "lead" ? "Lead asignado" : "Tarea asignada";

  await pushNotification(assignee.id, {
    type: notifType,
    title: notifTitle,
    body: title,
    link,
  });
}

/** Notifica a todos los ADMIN cuando un post entra en revisión. */
export async function notifyAdminsMarketingPending(post) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (!admins.length) return;

  const preview =
    post.content?.length > 80
      ? `${post.content.slice(0, 80)}…`
      : post.content || "Nuevo contenido";
  const platform = post.platform || "red social";

  for (const admin of admins) {
    await pushNotification(admin.id, {
      type: "marketing_pending",
      title: "Post pendiente de aprobación",
      body: `${platform}: ${preview}`,
      link: "/marketing/pending",
    });
  }
}

/** Notifica a ADMIN cuando un presupuesto requiere aprobación. */
export async function notifyAdminsQuotePending(quote) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  const contactName = quote.contact?.name || quote.contact?.company || "Cliente";
  const label = quote.number || "Presupuesto";

  for (const admin of admins) {
    await pushNotification(admin.id, {
      type: "quote_pending",
      title: "Presupuesto pendiente de aprobación",
      body: `${label} — ${contactName}`,
      link: `/presupuestos/${quote.id}`,
    });
  }
}
