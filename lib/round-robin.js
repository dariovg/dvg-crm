import { prisma } from "./prisma";

const SETTING_KEY = "round_robin_index";

/** Siguiente miembro del equipo para asignar leads web (MEMBER + MANAGER). */
export async function pickRoundRobinAssignee() {
  if (process.env.CRM_ROUND_ROBIN === "false") return null;

  const team = await prisma.user.findMany({
    where: { role: { in: ["MEMBER", "MANAGER"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!team.length) return null;

  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } });
  const idx = row ? parseInt(row.value, 10) || 0 : 0;
  const assignee = team[idx % team.length];

  await prisma.appSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value: String((idx + 1) % team.length) },
    create: { key: SETTING_KEY, value: String((idx + 1) % team.length) },
  });

  return assignee.id;
}
