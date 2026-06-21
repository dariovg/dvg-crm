import { prisma } from "../prisma.js";
import { sendMail, isMailConfigured } from "../mail.js";
import { pushNotification } from "../notifications.js";
import { APP_DISPLAY_NAME } from "../app-brand.js";

const STALE_HOURS = 24;
const ALERT_COOLDOWN_HOURS = 24;
const SETTING_KEY = "marketing_stale_alert_sent_at";

function crmBaseUrl() {
  return process.env.NEXTAUTH_URL || "https://crm.dvgsstudio.com";
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

/** Posts en PENDING_APPROVAL con más de 24h sin revisar. */
export async function findStalePendingPosts() {
  const threshold = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);
  return prisma.socialPost.findMany({
    where: {
      status: "PENDING_APPROVAL",
      createdAt: { lte: threshold },
    },
    include: {
      createdBy: { select: { name: true, email: true } },
      campaign: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
}

/** Envía mensaje a Slack Incoming Webhook (opcional). */
export async function sendSlackMessage(text) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return res.ok;
  } catch (err) {
    console.error("[slack]", err.message);
    return false;
  }
}

/**
 * Alerta admins si hay posts pendientes >24h.
 * Slack (opcional) + email SMTP + notificación in-app.
 * Cooldown 24h para no spamear.
 */
export async function alertStalePendingPosts() {
  const stale = await findStalePendingPosts();
  if (!stale.length) {
    return { sent: false, reason: "none_stale", count: 0 };
  }

  const lastSent = await getSetting(SETTING_KEY);
  if (lastSent) {
    const elapsed = Date.now() - new Date(lastSent).getTime();
    if (elapsed < ALERT_COOLDOWN_HOURS * 60 * 60 * 1000) {
      return { sent: false, reason: "cooldown", count: stale.length };
    }
  }

  const count = stale.length;
  const oldest = stale[0];
  const oldestHours = Math.round(
    (Date.now() - new Date(oldest.createdAt).getTime()) / 3_600_000
  );
  const link = `${crmBaseUrl()}/marketing/pending`;
  const summary = `${count} post(s) pendiente(s) de aprobación desde hace más de 24h. El más antiguo lleva ~${oldestHours}h.`;

  const slackText = `⚠️ *Marketing ${APP_DISPLAY_NAME}* — ${summary}\n<${link}|Revisar pendientes>`;
  const emailSubject = `[${APP_DISPLAY_NAME}] ${count} posts pendientes >24h`;
  const postLines = stale
    .slice(0, 10)
    .map(
      (p) =>
        `• ${p.platform}: ${p.content.slice(0, 80)}${p.content.length > 80 ? "…" : ""}`
    )
    .join("\n");
  const emailText = `${summary}\n\nRevisar: ${link}\n\n${postLines}`;

  const slackOk = await sendSlackMessage(slackText);

  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "MANAGER"] } },
    select: { id: true, email: true },
  });

  let emailOk = false;
  const emailed = new Set();

  for (const admin of admins) {
    if (!admin.email || emailed.has(admin.email)) continue;
    emailed.add(admin.email);
    if (await sendMail({ to: admin.email, subject: emailSubject, text: emailText })) {
      emailOk = true;
    }
    await pushNotification(admin.id, {
      type: "marketing_stale",
      title: `${count} posts pendientes >24h`,
      body: summary,
      link: "/marketing/pending",
    });
  }

  const fallbackEmail = process.env.CRM_ADMIN_EMAIL;
  if (
    fallbackEmail &&
    !emailed.has(fallbackEmail) &&
    isMailConfigured()
  ) {
    if (
      await sendMail({ to: fallbackEmail, subject: emailSubject, text: emailText })
    ) {
      emailOk = true;
    }
  }

  if (slackOk || emailOk) {
    await setSetting(SETTING_KEY, new Date().toISOString());
  }

  return {
    sent: slackOk || emailOk,
    slack: slackOk,
    email: emailOk,
    count,
    notified: admins.length,
  };
}
