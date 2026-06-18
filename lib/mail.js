import nodemailer from "nodemailer";

export function isMailConfigured() {
  return !!(
    process.env.CRM_SMTP_HOST &&
    process.env.CRM_SMTP_USER &&
    process.env.CRM_SMTP_PASS
  );
}

function transporter() {
  const port = parseInt(process.env.CRM_SMTP_PORT || "587", 10);
  return nodemailer.createTransport({
    host: process.env.CRM_SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.CRM_SMTP_USER,
      pass: process.env.CRM_SMTP_PASS,
    },
  });
}

/** @returns {Promise<boolean>} */
export async function sendMail({ to, subject, text, html }) {
  if (!isMailConfigured() || !to) return false;
  try {
    await transporter().sendMail({
      from: process.env.CRM_MAIL_FROM || process.env.CRM_SMTP_USER,
      to,
      subject,
      text,
      html: html || text,
    });
    return true;
  } catch (err) {
    console.error("[mail]", err.message);
    return false;
  }
}

export async function notifyAssignment({
  assigneeEmail,
  assigneeName,
  type,
  title,
  link,
}) {
  if (!assigneeEmail) return false;
  const name = assigneeName || assigneeEmail.split("@")[0];
  const kind = type === "task" ? "tarea" : "lead";
  const subject = `Nuevo ${kind} asignado — DVG CRM`;
  const text = `Hola ${name},\n\nSe te ha asignado ${kind === "tarea" ? "la tarea" : "el lead"}: ${title}\n\nVer en CRM: ${link}`;
  const html = `<p>Hola ${name},</p><p>Se te ha asignado ${kind === "tarea" ? "la tarea" : "el lead"}: <strong>${title}</strong></p><p><a href="${link}">Abrir en CRM</a></p>`;
  return sendMail({ to: assigneeEmail, subject, text, html });
}
