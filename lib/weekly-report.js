import { prisma } from "./prisma.js";
import { sendMail, isMailConfigured } from "./mail.js";
import { CONTACT_STATUSES } from "./constants.js";
import { taskDueStatus } from "./crm-utils.js";

const SETTING_KEY = "weekly_report_sent_week";

function crmBaseUrl() {
  return process.env.NEXTAUTH_URL || "https://crm.dvgsstudio.com";
}

/** ISO week key e.g. "2026-W25" in Europe/Madrid */
export function currentWeekKey(timeZone = "Europe/Madrid") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parseInt(parts.find((p) => p.type === "year").value, 10);
  const m = parseInt(parts.find((p) => p.type === "month").value, 10);
  const d = parseInt(parts.find((p) => p.type === "day").value, 10);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** @param {string} [timeZone] */
export function isReportDay(timeZone = "Europe/Madrid") {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(new Date());
  const target = process.env.WEEKLY_REPORT_WEEKDAY || "Mon";
  return weekday === target;
}

async function getSetting(key) {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

async function setSetting(key, value) {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

/** Admin-only org-wide KPIs for the last 7 days. */
export async function gatherWeeklyKpis() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const [
    newLeads,
    byStatus,
    pendingMarketing,
    openTasks,
    tasksDoneWeek,
    unassigned,
    dealAgg,
  ] = await Promise.all([
    prisma.contact.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.contact.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.socialPost.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.task.findMany({
      where: { done: false },
      select: { dueAt: true, done: true },
    }),
    prisma.task.count({
      where: { done: true, updatedAt: { gte: weekAgo } },
    }),
    prisma.contact.count({ where: { assigneeId: null } }),
    prisma.contact.aggregate({
      where: { status: { not: "LOST" }, dealValue: { not: null } },
      _sum: { dealValue: true },
    }),
  ]);

  const counts = Object.fromEntries(
    byStatus.map((b) => [b.status, b._count._all])
  );

  let overdueTasks = 0;
  for (const t of openTasks) {
    if (taskDueStatus(t.dueAt, false) === "overdue") overdueTasks++;
  }

  const pipeline = CONTACT_STATUSES.filter((s) => s.id !== "LOST").map(
    (s) => ({
      label: s.label,
      count: counts[s.id] || 0,
    })
  );

  return {
    periodStart: weekAgo,
    periodEnd: now,
    newLeads,
    tasksDoneWeek,
    pendingMarketing,
    overdueTasks,
    openTasks: openTasks.length,
    unassigned,
    pipelineValue: dealAgg._sum.dealValue || 0,
    pipeline,
    totalLeads: Object.values(counts).reduce((a, b) => a + b, 0),
  };
}

/** @param {Awaited<ReturnType<typeof gatherWeeklyKpis>>} kpis */
export function formatWeeklyReportEmail(kpis) {
  const base = crmBaseUrl();
  const from = kpis.periodStart.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
  const to = kpis.periodEnd.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const pipelineLines = kpis.pipeline
    .filter((p) => p.count > 0)
    .map((p) => `  • ${p.label}: ${p.count}`)
    .join("\n");

  const subject = `[DVG CRM] Informe semanal — ${newLeadsLabel(kpis.newLeads)} leads nuevos`;
  const text = [
    `Informe semanal DVG CRM (${from} – ${to})`,
    "",
    "── KPIs (últimos 7 días) ──",
    `• Leads nuevos: ${kpis.newLeads}`,
    `• Tareas completadas: ${kpis.tasksDoneWeek}`,
    `• Tareas vencidas (ahora): ${kpis.overdueTasks}`,
    `• Tareas abiertas: ${kpis.openTasks}`,
    `• Posts marketing pendientes: ${kpis.pendingMarketing}`,
    `• Leads sin asignar: ${kpis.unassigned}`,
    `• Valor pipeline activo: ${formatEuro(kpis.pipelineValue)}`,
    "",
    "── Pipeline por etapa ──",
    pipelineLines || "  (sin contactos)",
    "",
    `Ver dashboard: ${base}/dashboard`,
    `Posts pendientes: ${base}/marketing/pending`,
    `Tareas: ${base}/tasks`,
  ].join("\n");

  const pipelineHtml = kpis.pipeline
    .filter((p) => p.count > 0)
    .map((p) => `<li>${p.label}: <strong>${p.count}</strong></li>`)
    .join("");

  const html = `
    <h2>Informe semanal DVG CRM</h2>
    <p><em>${from} – ${to}</em></p>
    <h3>KPIs (últimos 7 días)</h3>
    <ul>
      <li>Leads nuevos: <strong>${kpis.newLeads}</strong></li>
      <li>Tareas completadas: <strong>${kpis.tasksDoneWeek}</strong></li>
      <li>Tareas vencidas: <strong>${kpis.overdueTasks}</strong></li>
      <li>Tareas abiertas: <strong>${kpis.openTasks}</strong></li>
      <li>Posts marketing pendientes: <strong>${kpis.pendingMarketing}</strong></li>
      <li>Leads sin asignar: <strong>${kpis.unassigned}</strong></li>
      <li>Valor pipeline activo: <strong>${formatEuro(kpis.pipelineValue)}</strong></li>
    </ul>
    <h3>Pipeline por etapa</h3>
    <ul>${pipelineHtml || "<li>Sin contactos</li>"}</ul>
    <p>
      <a href="${base}/dashboard">Dashboard</a> ·
      <a href="${base}/marketing/pending">Posts pendientes</a> ·
      <a href="${base}/tasks">Tareas</a>
    </p>
  `;

  return { subject, text, html };
}

function newLeadsLabel(n) {
  return String(n);
}

function formatEuro(amount) {
  if (!amount) return "0 €";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Sends weekly report to ADMIN users. Runs daily via cron; sends only on Monday
 * (or WEEKLY_REPORT_WEEKDAY) once per ISO week.
 * @returns {Promise<{ sent: boolean, reason?: string, recipients?: number, weekKey?: string }>}
 */
export async function sendWeeklyReportIfDue() {
  if (!isReportDay()) {
    return { sent: false, reason: "not_report_day" };
  }

  if (!isMailConfigured()) {
    return { sent: false, reason: "mail_not_configured" };
  }

  const weekKey = currentWeekKey();
  const lastSent = await getSetting(SETTING_KEY);
  if (lastSent === weekKey) {
    return { sent: false, reason: "already_sent", weekKey };
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });

  const emails = admins.map((a) => a.email).filter(Boolean);
  const fallback = process.env.CRM_ADMIN_EMAIL;
  if (fallback && !emails.includes(fallback)) emails.push(fallback);

  if (!emails.length) {
    return { sent: false, reason: "no_admin_email", weekKey };
  }

  const kpis = await gatherWeeklyKpis();
  const { subject, text, html } = formatWeeklyReportEmail(kpis);

  let sentCount = 0;
  for (const to of emails) {
    if (await sendMail({ to, subject, text, html })) sentCount++;
  }

  if (sentCount > 0) {
    await setSetting(SETTING_KEY, weekKey);
    return { sent: true, recipients: sentCount, weekKey, kpis: summarize(kpis) };
  }

  return { sent: false, reason: "send_failed", weekKey };
}

function summarize(kpis) {
  return {
    newLeads: kpis.newLeads,
    pendingMarketing: kpis.pendingMarketing,
    overdueTasks: kpis.overdueTasks,
  };
}
