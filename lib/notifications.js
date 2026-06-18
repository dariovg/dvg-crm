import { prisma } from "./prisma";

export async function pushNotification(userId, { type, title, body, link }) {
  if (!userId || userId === "env-admin") return;
  await prisma.notification.create({
    data: { userId, type, title, body: body || null, link: link || null },
  });
}
