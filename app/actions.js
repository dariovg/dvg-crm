"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import {
  requireAuthSession,
  requireAdminSession,
  requireStaffSession,
} from "@/lib/auth-server";
import {
  canAccessContact,
  canAccessTask,
  canAccessQuote,
  canApproveQuote,
  canEditQuote,
  canAccessSalesCrm,
  canDeleteContact,
  contactScope,
  isStaff,
  quoteScope,
} from "@/lib/permissions";
import { notifyAssignment, sendMail, isMailConfigured } from "@/lib/mail";
import { saveCrmSettings as persistCrmSettings, getScoringRules } from "@/lib/crm-settings";
import { withLeadScores } from "@/lib/lead-score";
import { pushNotification } from "@/lib/notifications";
import { generateTotpSecret, getTotpUri, verifyTotpToken } from "@/lib/totp";
import {
  catalogPriceForPack,
  computeQuoteTotal,
  generateQuoteNumber,
  needsApproval,
  packLineDescription,
} from "@/lib/quotes";
import { planById } from "@/lib/pricing-catalog";
import { buildLinesFromTemplate, templateById } from "@/lib/quote-templates";
import { generateShareToken } from "@/lib/quote-share";
import { recordAudit } from "@/lib/audit";
import {
  listActiveSessions,
  revokeAllUserSessions,
  revokeSession,
} from "@/lib/session-tracker";

function appUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.CRM_APP_URL ||
    "https://crm.dvgsstudio.com"
  ).replace(/\/$/, "");
}

async function notifyAssignee(userId, assignee, type, title, path) {
  if (!assignee?.id) return;
  await mailAssignee(assignee, type, title, path);
  if (userId !== assignee.id) {
    await pushNotification(assignee.id, {
      type: type === "lead" ? "lead_assigned" : "task_assigned",
      title: type === "lead" ? "Lead asignado" : "Tarea asignada",
      body: title,
      link: path,
    });
  }
}

async function mailAssignee(assignee, type, title, path) {
  if (!assignee?.email) return;
  await notifyAssignment({
    assigneeEmail: assignee.email,
    assigneeName: assignee.name,
    type,
    title,
    link: `${appUrl()}${path}`,
  });
}

async function spawnRecurringTask(task) {
  if (!task.recurDays || task.recurDays < 1) return;
  const base = task.dueAt ? new Date(task.dueAt) : new Date();
  const nextDue = new Date(base);
  nextDue.setDate(nextDue.getDate() + task.recurDays);
  await prisma.task.create({
    data: {
      contactId: task.contactId,
      title: task.title,
      assigneeId: task.assigneeId,
      priority: task.priority,
      recurDays: task.recurDays,
      dueAt: nextDue,
    },
  });
}

function actorId(session) {
  return session.user.id !== "env-admin" ? session.user.id : null;
}

async function getContactForUser(session, contactId) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
  });
  if (!contact || !canAccessContact(session, contact)) {
    throw new Error("No autorizado");
  }
  return contact;
}

export async function findDuplicateByEmail(email) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  return prisma.contact.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: { id: true, name: true, email: true, status: true },
  });
}

export async function createManualContact(data) {
  const session = await requireAuthSession();
  if (!canAccessSalesCrm(session)) throw new Error("Sin permiso");
  const email = data.email.trim().toLowerCase();
  const name = data.name.trim();
  if (!name || !email) throw new Error("Nombre y email obligatorios");

  const duplicate = await findDuplicateByEmail(email);
  if (duplicate && !data.allowDuplicate) {
    return { ok: false, duplicate };
  }

  const userId = actorId(session);
  const assigneeId =
    isStaff(session) && data.assigneeId
      ? data.assigneeId
      : userId || null;

  const contact = await prisma.contact.create({
    data: {
      name,
      email,
      phone: data.phone?.trim() || null,
      company: data.company?.trim() || null,
      interest: data.interest?.trim() || null,
      notes: data.notes?.trim() || null,
      source: "MANUAL",
      assigneeId,
      createdById: userId,
      dealValue: data.dealValue ? parseInt(data.dealValue, 10) : null,
      tags: data.tags || [],
    },
  });

  await prisma.contactEvent.create({
    data: {
      contactId: contact.id,
      type: "created_manual",
      summary: "Lead creado manualmente",
      userId,
    },
  });

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true, contactId: contact.id };
}

export async function updateContactStatus(contactId, status, lostReason) {
  const session = await requireAuthSession();
  await getContactForUser(session, contactId);

  if (status === "LOST" && !lostReason?.trim()) {
    throw new Error("Indica el motivo de pérdida");
  }

  await prisma.contact.update({
    where: { id: contactId },
    data: {
      status,
      lostReason: status === "LOST" ? lostReason.trim() : null,
    },
  });
  await prisma.contactEvent.create({
    data: {
      contactId,
      type: "status_changed",
      summary:
        status === "LOST"
          ? `Perdido: ${lostReason.trim()}`
          : `Estado cambiado a ${status}`,
      userId: actorId(session),
    },
  });
  await recordAudit({
    userId: actorId(session),
    action: "contact.status_changed",
    entityType: "contact",
    entityId: contactId,
    summary:
      status === "LOST"
        ? `Lead perdido: ${lostReason.trim()}`
        : `Estado del lead → ${status}`,
    payload: { status, lostReason: status === "LOST" ? lostReason.trim() : null },
  });
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  revalidatePath(`/leads/${contactId}`);
}

export async function updateContactDetails(contactId, { dealValue, tags, notes }) {
  const session = await requireAuthSession();
  await getContactForUser(session, contactId);

  const data = {};
  if (dealValue !== undefined) {
    data.dealValue = dealValue === "" || dealValue == null ? null : parseInt(dealValue, 10);
  }
  if (tags !== undefined) data.tags = tags;
  if (notes !== undefined) data.notes = notes;

  await prisma.contact.update({ where: { id: contactId }, data });
  await prisma.contactEvent.create({
    data: {
      contactId,
      type: "details_updated",
      summary: "Datos del lead actualizados",
      userId: actorId(session),
    },
  });
  revalidatePath(`/leads/${contactId}`);
  revalidatePath("/leads");
}

export async function updateContactProfile(contactId, data) {
  const session = await requireAuthSession();
  await getContactForUser(session, contactId);

  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  if (!name || !email) throw new Error("Nombre y email obligatorios");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email no válido");
  }

  const duplicate = await prisma.contact.findFirst({
    where: { email, id: { not: contactId } },
    select: { id: true, name: true },
  });
  if (duplicate) {
    throw new Error(`Ya existe otro lead con ese email (${duplicate.name})`);
  }

  await prisma.contact.update({
    where: { id: contactId },
    data: {
      name,
      email,
      phone: data.phone?.trim() || null,
      company: data.company?.trim() || null,
      interest: data.interest?.trim() || null,
    },
  });

  await prisma.contactEvent.create({
    data: {
      contactId,
      type: "profile_updated",
      summary: "Datos de contacto actualizados",
      userId: actorId(session),
    },
  });

  revalidatePath(`/leads/${contactId}`);
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  return { ok: true };
}

export async function deleteContact(contactId) {
  const session = await requireStaffSession();
  if (!canDeleteContact(session)) throw new Error("Sin permiso");

  const contact = await getContactForUser(session, contactId);

  await recordAudit({
    userId: actorId(session),
    action: "contact.deleted",
    entityType: "contact",
    entityId: contactId,
    summary: `Lead eliminado: ${contact.name} (${contact.email})`,
    payload: { source: contact.source, status: contact.status },
  });

  await prisma.contact.delete({ where: { id: contactId } });

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function assignContact(contactId, assigneeId) {
  const session = await requireStaffSession();
  const assignee = assigneeId
    ? await prisma.user.findUnique({ where: { id: assigneeId } })
    : null;
  if (assigneeId && !assignee) throw new Error("Usuario no encontrado");

  await prisma.contact.update({
    where: { id: contactId },
    data: { assigneeId: assigneeId || null },
  });
  await prisma.contactEvent.create({
    data: {
      contactId,
      type: "assigned",
      summary: assignee
        ? `Asignado a ${assignee.name || assignee.email}`
        : "Sin asignar",
      userId: actorId(session),
    },
  });
  if (assignee && assignee.id !== actorId(session)) {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { name: true },
    });
    await notifyAssignee(
      actorId(session),
      assignee,
      "lead",
      contact?.name || "Lead",
      `/leads/${contactId}`
    );
  }
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  revalidatePath(`/leads/${contactId}`);
}

export async function bulkAssignContacts(contactIds, assigneeId) {
  const session = await requireStaffSession();
  if (!contactIds?.length) return;
  const assignee = assigneeId
    ? await prisma.user.findUnique({ where: { id: assigneeId } })
    : null;
  if (assigneeId && !assignee) throw new Error("Usuario no encontrado");

  for (const id of contactIds) {
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact || !canAccessContact(session, contact)) continue;
    await prisma.contact.update({
      where: { id },
      data: { assigneeId: assigneeId || null },
    });
    await prisma.contactEvent.create({
      data: {
        contactId: id,
        type: "assigned",
        summary: assignee
          ? `Asignación masiva a ${assignee.name || assignee.email}`
          : "Desasignado (masivo)",
        userId: actorId(session),
      },
    });
    if (assignee && assignee.id !== actorId(session)) {
      const c = await prisma.contact.findUnique({
        where: { id },
        select: { name: true },
      });
      await notifyAssignee(actorId(session), assignee, "lead", c?.name || "Lead", `/leads/${id}`);
    }
  }
  revalidatePath("/leads");
  revalidatePath("/pipeline");
}

export async function updateContactNotes(contactId, notes) {
  return updateContactDetails(contactId, { notes });
}

export async function createTask(
  contactId,
  title,
  dueAt,
  assigneeId,
  priority,
  recurDays
) {
  const session = await requireAuthSession();
  await getContactForUser(session, contactId);
  const targetAssignee =
    isStaff(session) && assigneeId ? assigneeId : actorId(session);

  const task = await prisma.task.create({
    data: {
      contactId,
      title,
      dueAt: dueAt ? new Date(dueAt) : null,
      assigneeId: targetAssignee,
      priority: priority || "MEDIUM",
      recurDays: recurDays ? parseInt(recurDays, 10) : null,
    },
  });

  await prisma.contactEvent.create({
    data: {
      contactId,
      type: "task_created",
      summary: title,
      payload: { taskId: task.id },
      userId: actorId(session),
    },
  });

  if (targetAssignee && targetAssignee !== actorId(session)) {
    const assignee = await prisma.user.findUnique({
      where: { id: targetAssignee },
    });
    await notifyAssignee(actorId(session), assignee, "task", title, `/leads/${contactId}`);
  }

  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath(`/leads/${contactId}`);
  return task;
}

export async function toggleTask(taskId, done) {
  const session = await requireAuthSession();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || !canAccessTask(session, task)) throw new Error("No autorizado");
  const wasDone = task.done;
  await prisma.task.update({
    where: { id: taskId },
    data: { done },
  });
  if (done && !wasDone) {
    await prisma.contactEvent.create({
      data: {
        contactId: task.contactId,
        type: "task_completed",
        summary: task.title,
        payload: { taskId: task.id },
        userId: actorId(session),
      },
    });
  }
  if (done && task.recurDays) {
    await spawnRecurringTask(task);
  }
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath(`/leads/${task.contactId}`);
}

export async function updateTask(taskId, { title, dueAt, assigneeId, done, priority, recurDays }) {
  const session = await requireAuthSession();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || !canAccessTask(session, task)) throw new Error("No autorizado");

  const data = {};
  if (title != null) data.title = title;
  if (dueAt !== undefined) data.dueAt = dueAt ? new Date(dueAt) : null;
  if (done != null) data.done = done;
  if (priority != null) data.priority = priority;
  if (recurDays !== undefined) {
    data.recurDays = recurDays ? parseInt(recurDays, 10) : null;
  }
  if (isStaff(session) && assigneeId !== undefined) {
    data.assigneeId = assigneeId || null;
  }

  const wasDone = task.done;
  await prisma.task.update({ where: { id: taskId }, data });

  if (done === true && !wasDone) {
    await prisma.contactEvent.create({
      data: {
        contactId: task.contactId,
        type: "task_completed",
        summary: title || task.title,
        payload: { taskId: task.id },
        userId: actorId(session),
      },
    });
  }

  if (isStaff(session) && assigneeId && assigneeId !== task.assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
    await notifyAssignee(
      actorId(session),
      assignee,
      "task",
      title || task.title,
      `/leads/${task.contactId}`
    );
  }

  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath(`/leads/${task.contactId}`);
}

export async function deleteTask(taskId) {
  const session = await requireAuthSession();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || !canAccessTask(session, task)) throw new Error("No autorizado");
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath(`/leads/${task.contactId}`);
}

export async function fetchScopedContacts(filters = {}) {
  const session = await requireAuthSession();
  const where = { ...contactScope(session) };

  if (filters.status) where.status = filters.status;
  if (filters.source) where.source = filters.source;
  if (filters.assigneeId === "none") where.assigneeId = null;
  else if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
      { company: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const rules = await getScoringRules();
  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      assignee: { select: { id: true, email: true, name: true, role: true } },
      meetings: { orderBy: { createdAt: "desc" }, take: 1 },
      quotes: { select: { id: true }, take: 1 },
      surveys: { orderBy: { createdAt: "desc" }, take: 1, select: { score: true } },
      events: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      tasks: { orderBy: { updatedAt: "desc" }, take: 1, select: { updatedAt: true, createdAt: true } },
    },
  });
  return withLeadScores(contacts, rules);
}

export async function sendLeadEmail(contactId, { subject, body }) {
  const session = await requireAuthSession();
  const contact = await getContactForUser(session, contactId);

  if (!isMailConfigured()) {
    return { ok: false, error: "SMTP no configurado (CRM_SMTP_*)." };
  }

  const trimmedSubject = subject?.trim();
  const trimmedBody = body?.trim();
  if (!trimmedSubject || !trimmedBody) {
    return { ok: false, error: "Asunto y mensaje obligatorios." };
  }

  const sent = await sendMail({
    to: contact.email,
    subject: trimmedSubject,
    text: trimmedBody,
    html: trimmedBody.replace(/\n/g, "<br>"),
  });

  if (!sent) {
    return { ok: false, error: "No se pudo enviar el email." };
  }

  await prisma.contactEvent.create({
    data: {
      contactId,
      type: "email_sent",
      summary: trimmedSubject,
      payload: { to: contact.email },
      userId: actorId(session),
    },
  });

  revalidatePath(`/leads/${contactId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function saveCrmSettings(settings) {
  await requireAdminSession();
  await persistCrmSettings(settings);
  revalidatePath("/admin/crm-settings");
  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath("/pipeline");
}

export async function globalSearch(query) {
  const session = await requireAuthSession();
  const q = query?.trim();
  if (!q || q.length < 2) return { contacts: [], tasks: [] };

  const scope = contactScope(session);

  const [contacts, tasks] = await Promise.all([
    prisma.contact.findMany({
      where: {
        ...scope,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, email: true, status: true },
    }),
    prisma.task.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
        contact: scope,
      },
      take: 6,
      include: { contact: { select: { id: true, name: true } } },
    }),
  ]);

  return { contacts, tasks };
}

export async function createTeamUser({ email, name, password, role }) {
  const session = await requireAdminSession();
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) throw new Error("Email y contraseña obligatorios");
  if (!["MEMBER", "MANAGER", "MARKETING"].includes(role)) throw new Error("Rol no válido");

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) throw new Error("Ya existe ese email");

  await prisma.user.create({
    data: {
      email: normalized,
      name: name?.trim() || normalized.split("@")[0],
      passwordHash: hashPassword(password),
      role,
    },
  });
  await recordAudit({
    userId: actorId(session),
    action: "user.created",
    entityType: "user",
    summary: `Usuario creado: ${normalized} (${role})`,
    payload: { email: normalized, role },
  });
  revalidatePath("/admin/users");
}

export async function updateTeamUser(userId, { name, role }) {
  const session = await requireAdminSession();
  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true, name: true },
  });
  if (!before) throw new Error("Usuario no encontrado");

  const data = {};
  if (name?.trim()) data.name = name.trim();
  if (role) {
    if (!["MEMBER", "MANAGER", "ADMIN", "MARKETING"].includes(role)) {
      throw new Error("Rol no válido");
    }
    data.role = role;
  }
  if (!Object.keys(data).length) return;

  await prisma.user.update({ where: { id: userId }, data });
  if (role && role !== before.role) {
    await recordAudit({
      userId: actorId(session),
      action: "user.role_changed",
      entityType: "user",
      entityId: userId,
      summary: `Rol de ${before.email}: ${before.role} → ${role}`,
      payload: { from: before.role, to: role },
    });
  }
  revalidatePath("/admin/users");
}

export async function fetchNotifications() {
  const session = await requireAuthSession();
  const userId = session.user.id;
  if (!userId || userId === "env-admin") return { items: [], unread: 0 };

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return { items, unread };
}

export async function markNotificationRead(id) {
  const session = await requireAuthSession();
  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  });
}

export async function markAllNotificationsRead() {
  const session = await requireAuthSession();
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQ = !inQ;
    else if (c === "," && !inQ) {
      out.push(cur.trim());
      cur = "";
    } else cur += c;
  }
  out.push(cur.trim());
  return out;
}

export async function importLeadsFromCsv(text) {
  const session = await requireStaffSession();
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV vacío o sin filas de datos");

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (names) => {
    for (const n of names) {
      const i = headers.indexOf(n);
      if (i >= 0) return i;
    }
    return -1;
  };
  const iName = idx(["nombre", "name"]);
  const iEmail = idx(["email", "correo"]);
  if (iName < 0 || iEmail < 0) throw new Error("Faltan columnas nombre y email");

  const iPhone = idx(["telefono", "teléfono", "phone"]);
  const iCompany = idx(["empresa", "company"]);
  const iInterest = idx(["interes", "interés", "interest"]);
  const iValue = idx(["valor", "deal", "value"]);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let r = 1; r < lines.length; r++) {
    const cols = parseCsvLine(lines[r]);
    const name = cols[iName]?.trim();
    const email = cols[iEmail]?.trim().toLowerCase();
    if (!name || !email) {
      errors++;
      continue;
    }
    const dup = await findDuplicateByEmail(email);
    if (dup) {
      skipped++;
      continue;
    }
    try {
      await prisma.contact.create({
        data: {
          name,
          email,
          phone: iPhone >= 0 ? cols[iPhone]?.trim() || null : null,
          company: iCompany >= 0 ? cols[iCompany]?.trim() || null : null,
          interest: iInterest >= 0 ? cols[iInterest]?.trim() || null : null,
          dealValue:
            iValue >= 0 && cols[iValue]
              ? parseInt(String(cols[iValue]).replace(/\D/g, ""), 10) || null
              : null,
          source: "MANUAL",
          createdById: actorId(session),
        },
      });
      created++;
    } catch {
      errors++;
    }
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { created, skipped, errors };
}

export async function beginTotpSetup() {
  const session = await requireAdminSession();
  if (session.user.id === "env-admin") throw new Error("Activa admin en BD primero");
  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpSecret: secret, totpEnabled: false },
  });
  return {
    secret,
    uri: getTotpUri(secret, session.user.email),
  };
}

export async function confirmTotpSetup(code) {
  const session = await requireAdminSession();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.totpSecret) throw new Error("Inicia configuración primero");
  if (!verifyTotpToken(user.totpSecret, code)) throw new Error("Código incorrecto");
  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: true },
  });
  await recordAudit({
    userId: user.id,
    action: "security.2fa_enabled",
    entityType: "user",
    entityId: user.id,
    summary: "2FA activado",
  });
  revalidatePath("/admin/security");
}

export async function disableTotp() {
  const session = await requireAdminSession();
  if (session.user.role === "ADMIN") {
    throw new Error("2FA es obligatorio para administradores");
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpEnabled: false, totpSecret: null, totpBackupCodes: [] },
  });
  await recordAudit({
    userId: session.user.id,
    action: "security.2fa_disabled",
    entityType: "user",
    entityId: session.user.id,
    summary: "2FA desactivado",
  });
  revalidatePath("/admin/security");
}

export async function fetchActiveSessions() {
  await requireAdminSession();
  return listActiveSessions();
}

export async function revokeActiveSession(sessionId) {
  const session = await requireAdminSession();
  const result = await revokeSession(sessionId, session.user.id);
  if (!result) throw new Error("Sesión no encontrada");

  await recordAudit({
    userId: session.user.id,
    action: "session.revoked",
    entityType: "session",
    entityId: sessionId,
    summary: `Sesión cerrada remotamente (${result.session.user?.email || result.session.userId})`,
  });

  revalidatePath("/admin/security");
  return { ok: true };
}

export async function revokeAllSessions(userId, keepCurrent = false) {
  const session = await requireAdminSession();
  const targetUserId = userId || session.user.id;
  const exceptSessionId =
    keepCurrent && targetUserId === session.user.id
      ? session.user.sessionId
      : undefined;

  const count = await revokeAllUserSessions(targetUserId, exceptSessionId);

  await recordAudit({
    userId: session.user.id,
    action: "session.revoked_all",
    entityType: "user",
    entityId: targetUserId,
    summary: `Cerradas ${count} sesión(es) activas`,
    payload: { keepCurrent: !!exceptSessionId },
  });

  revalidatePath("/admin/security");
  return { ok: true, count };
}

// ——— Presupuestos ———

async function getQuoteForUser(session, quoteId) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      contact: true,
      lines: { orderBy: { sortOrder: "asc" } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!quote || !canAccessQuote(session, quote)) {
    throw new Error("No autorizado");
  }
  return quote;
}

function defaultValidUntil() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

async function notifyAdminsQuotePending(quote) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  const link = `/presupuestos/${quote.id}`;
  const title = `Presupuesto ${quote.number} pendiente de aprobación`;
  const body = `${quote.contact?.name || "Cliente"} — precio pack por debajo del catálogo`;
  for (const admin of admins) {
    await pushNotification(admin.id, {
      type: "quote_pending",
      title,
      body,
      link,
    });
  }
}

async function syncQuoteLines(quoteId, lines) {
  await prisma.quoteLine.deleteMany({ where: { quoteId } });
  if (!lines?.length) return;
  await prisma.quoteLine.createMany({
    data: lines.map((line, i) => ({
      quoteId,
      type: line.type || "CUSTOM",
      description: line.description,
      quantity: line.quantity ?? 1,
      unitPrice: line.unitPrice,
      discountPercent: line.discountPercent ?? null,
      sortOrder: line.sortOrder ?? i,
      packId: line.packId ?? null,
    })),
  });
}

function revalidateQuotePaths(quoteId, contactId) {
  revalidatePath("/presupuestos");
  revalidatePath(`/presupuestos/${quoteId}`);
  revalidatePath(`/presupuestos/${quoteId}/pdf`);
  if (contactId) revalidatePath(`/leads/${contactId}`);
}

export async function createQuote(
  contactId,
  { packId, billing = "MONTHLY", customLines = [], projectType = "IA", useTemplate = true } = {}
) {
  const session = await requireAuthSession();
  await getContactForUser(session, contactId);

  const number = await generateQuoteNumber(prisma);
  let resolvedBilling = billing;
  let resolvedPackId = packId;
  let resolvedNotes = null;
  let lines = [];

  if (useTemplate && projectType && templateById(projectType)) {
    const built = buildLinesFromTemplate(
      projectType,
      billing,
      catalogPriceForPack,
      packLineDescription
    );
    resolvedBilling = built.billing;
    resolvedPackId = built.packId ?? packId ?? null;
    resolvedNotes = built.notes;
    lines = built.lines;
  }

  if (packId && projectType === "IA") {
    const price = catalogPriceForPack(packId, resolvedBilling);
    const nonPack = lines.filter((l) => l.type !== "PACK");
    lines = [
      {
        type: "PACK",
        packId,
        description: packLineDescription(packId),
        quantity: 1,
        unitPrice: price,
        sortOrder: 0,
      },
      ...nonPack.map((l, i) => ({ ...l, sortOrder: i + 1 })),
    ];
    resolvedPackId = packId;
  } else if (!lines.length && packId) {
    const price = catalogPriceForPack(packId, resolvedBilling);
    lines.push({
      type: "PACK",
      packId,
      description: packLineDescription(packId),
      quantity: 1,
      unitPrice: price,
      sortOrder: 0,
    });
    resolvedPackId = packId;
  }

  customLines.forEach((line, i) => {
    lines.push({
      type: "CUSTOM",
      description: line.description,
      quantity: line.quantity ?? 1,
      unitPrice: line.unitPrice ?? 0,
      discountPercent: line.discountPercent ?? null,
      sortOrder: lines.length + i,
    });
  });

  const quote = await prisma.quote.create({
    data: {
      number,
      contactId,
      createdById: actorId(session),
      billing: resolvedBilling,
      packId: resolvedPackId || null,
      projectType: projectType || "IA",
      notes: resolvedNotes,
      validUntil: defaultValidUntil(),
      lines: { create: lines },
    },
    include: { lines: true, contact: true },
  });

  await prisma.contactEvent.create({
    data: {
      contactId,
      type: "quote_created",
      summary: `Presupuesto ${number} creado`,
      userId: actorId(session),
    },
  });

  revalidateQuotePaths(quote.id, contactId);
  return { ok: true, quoteId: quote.id };
}

export async function updateQuote(quoteId, { lines, billing, notes, discountPercent, packId, projectType }) {
  const session = await requireAuthSession();
  const quote = await getQuoteForUser(session, quoteId);
  if (!canEditQuote(session, quote)) throw new Error("No autorizado");
  if (["SENT", "ACCEPTED"].includes(quote.status)) {
    throw new Error("No se puede editar un presupuesto enviado o aceptado");
  }

  const data = {};
  if (billing !== undefined) data.billing = billing;
  if (notes !== undefined) data.notes = notes?.trim() || null;
  if (projectType !== undefined) data.projectType = projectType;
  if (discountPercent !== undefined) {
    data.discountPercent =
      discountPercent === "" || discountPercent == null
        ? null
        : parseInt(discountPercent, 10);
  }
  if (packId !== undefined) data.packId = packId || null;

  if (Object.keys(data).length) {
    await prisma.quote.update({ where: { id: quoteId }, data });
  }

  if (lines) {
    await syncQuoteLines(quoteId, lines);
  }

  revalidateQuotePaths(quoteId, quote.contactId);
  return { ok: true };
}

export async function saveQuote(quoteId, payload) {
  const session = await requireAuthSession();
  if (payload) await updateQuote(quoteId, payload);

  const quote = await getQuoteForUser(session, quoteId);
  if (!canEditQuote(session, quote)) throw new Error("No autorizado");

  const lines = await prisma.quoteLine.findMany({
    where: { quoteId },
    orderBy: { sortOrder: "asc" },
  });

  const quoteData = { billing: quote.billing, discountPercent: quote.discountPercent };
  const requiresApproval = needsApproval(quoteData, lines);

  if (requiresApproval && quote.status !== "PENDING_APPROVAL") {
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: "PENDING_APPROVAL", approvalNote: null },
    });
    await notifyAdminsQuotePending({ ...quote, contact: quote.contact });
  } else if (!requiresApproval && quote.status === "PENDING_APPROVAL") {
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: "DRAFT" },
    });
  }

  revalidateQuotePaths(quoteId, quote.contactId);
  return { ok: true, needsApproval: requiresApproval };
}

export async function submitQuoteForApproval(quoteId, payload) {
  return saveQuote(quoteId, payload);
}

export async function approveQuote(quoteId) {
  const session = await requireAuthSession();
  if (!canApproveQuote(session)) throw new Error("Solo administración");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { contact: true, createdBy: true },
  });
  if (!quote) throw new Error("Presupuesto no encontrado");
  if (quote.status !== "PENDING_APPROVAL") {
    throw new Error("El presupuesto no está pendiente de aprobación");
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: "APPROVED",
      approvedById: actorId(session),
      approvedAt: new Date(),
    },
  });

  await recordAudit({
    userId: actorId(session),
    action: "quote.approved",
    entityType: "quote",
    entityId: quoteId,
    summary: `Presupuesto ${quote.number} aprobado`,
  });

  if (quote.createdById) {
    await pushNotification(quote.createdById, {
      type: "quote_approved",
      title: `Presupuesto ${quote.number} aprobado`,
      body: quote.contact?.name || "",
      link: `/presupuestos/${quoteId}`,
    });
  }

  revalidateQuotePaths(quoteId, quote.contactId);
  return { ok: true };
}

export async function rejectQuote(quoteId, note) {
  const session = await requireAuthSession();
  if (!canApproveQuote(session)) throw new Error("Solo administración");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { contact: true, createdBy: true },
  });
  if (!quote) throw new Error("Presupuesto no encontrado");
  if (quote.status !== "PENDING_APPROVAL") {
    throw new Error("El presupuesto no está pendiente de aprobación");
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: "REJECTED",
      approvalNote: note?.trim() || "Rechazado por administración",
    },
  });

  await recordAudit({
    userId: actorId(session),
    action: "quote.rejected",
    entityType: "quote",
    entityId: quoteId,
    summary: `Presupuesto ${quote.number} rechazado`,
    payload: { note: note?.trim() || null },
  });

  if (quote.createdById) {
    await pushNotification(quote.createdById, {
      type: "quote_rejected",
      title: `Presupuesto ${quote.number} rechazado`,
      body: note?.trim() || "",
      link: `/presupuestos/${quoteId}`,
    });
  }

  revalidateQuotePaths(quoteId, quote.contactId);
  return { ok: true };
}

export async function markQuoteSent(quoteId) {
  const session = await requireAuthSession();
  const quote = await getQuoteForUser(session, quoteId);
  if (!canEditQuote(session, quote)) throw new Error("No autorizado");

  if (quote.status === "PENDING_APPROVAL") {
    throw new Error("Debe aprobarse antes de enviar");
  }
  if (quote.status === "REJECTED") {
    throw new Error("Presupuesto rechazado — edítalo y guarda de nuevo");
  }

  const lines = quote.lines.length
    ? quote.lines
    : await prisma.quoteLine.findMany({ where: { quoteId }, orderBy: { sortOrder: "asc" } });

  if (needsApproval(quote, lines)) {
    throw new Error("Precio pack por debajo del catálogo — requiere aprobación");
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: "SENT",
      sentAt: new Date(),
      shareToken: quote.shareToken || generateShareToken(),
    },
  });

  const updated = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { shareToken: true },
  });

  await prisma.contactEvent.create({
    data: {
      contactId: quote.contactId,
      type: "quote_sent",
      summary: `Presupuesto ${quote.number} enviado`,
      userId: actorId(session),
    },
  });

  await recordAudit({
    userId: actorId(session),
    action: "quote.sent",
    entityType: "quote",
    entityId: quoteId,
    summary: `Presupuesto ${quote.number} enviado al cliente`,
  });

  revalidateQuotePaths(quoteId, quote.contactId);
  if (updated?.shareToken) revalidatePath(`/p/${updated.shareToken}`);
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  return { ok: true };
}

export async function markQuoteAccepted(quoteId) {
  const session = await requireAuthSession();
  const quote = await getQuoteForUser(session, quoteId);
  if (!canEditQuote(session, quote)) throw new Error("No autorizado");

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "ACCEPTED" },
  });

  await prisma.contactEvent.create({
    data: {
      contactId: quote.contactId,
      type: "quote_accepted",
      summary: `Presupuesto ${quote.number} aceptado`,
      userId: actorId(session),
    },
  });

  revalidateQuotePaths(quoteId, quote.contactId);
  return { ok: true };
}

export async function duplicateQuote(quoteId) {
  const session = await requireAuthSession();
  const quote = await getQuoteForUser(session, quoteId);

  const number = await generateQuoteNumber(prisma);
  const newQuote = await prisma.quote.create({
    data: {
      number,
      contactId: quote.contactId,
      createdById: actorId(session),
      status: "DRAFT",
      billing: quote.billing,
      packId: quote.packId,
      projectType: quote.projectType,
      discountPercent: quote.discountPercent,
      notes: quote.notes,
      validUntil: defaultValidUntil(),
      lines: {
        create: quote.lines.map((line, i) => ({
          type: line.type,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
          sortOrder: i,
          packId: line.packId,
        })),
      },
    },
  });

  revalidateQuotePaths(newQuote.id, quote.contactId);
  return { ok: true, quoteId: newQuote.id };
}

export async function applyQuoteTemplate(quoteId, projectType) {
  const session = await requireAuthSession();
  const quote = await getQuoteForUser(session, quoteId);
  if (!canEditQuote(session, quote)) throw new Error("No autorizado");
  if (["SENT", "ACCEPTED"].includes(quote.status)) {
    throw new Error("No se puede cambiar la plantilla de un presupuesto enviado");
  }
  if (!templateById(projectType)) throw new Error("Plantilla no válida");

  const built = buildLinesFromTemplate(
    projectType,
    quote.billing,
    catalogPriceForPack,
    packLineDescription
  );

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      projectType,
      billing: built.billing,
      packId: built.packId,
      notes: built.notes,
    },
  });
  await syncQuoteLines(quoteId, built.lines);

  revalidateQuotePaths(quoteId, quote.contactId);
  return { ok: true };
}

export async function fetchScopedQuotes(filters = {}) {
  const session = await requireAuthSession();
  const where = { ...quoteScope(session) };

  if (filters.status) where.status = filters.status;

  return prisma.quote.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      contact: { select: { id: true, name: true, email: true, company: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      lines: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function addPackToQuote(quoteId, packId) {
  const session = await requireAuthSession();
  const quote = await getQuoteForUser(session, quoteId);
  if (!canEditQuote(session, quote)) throw new Error("No autorizado");

  const price = catalogPriceForPack(packId, quote.billing);
  const existing = quote.lines.filter((l) => l.type !== "PACK" || l.packId !== packId);
  const packLines = quote.lines.filter((l) => l.type === "PACK");
  const otherPacks = packLines.filter((l) => l.packId !== packId);

  const lines = [
    ...otherPacks.map((l, i) => ({
      type: l.type,
      packId: l.packId,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discountPercent: l.discountPercent,
      sortOrder: i,
    })),
    {
      type: "PACK",
      packId,
      description: packLineDescription(packId),
      quantity: 1,
      unitPrice: price,
      sortOrder: otherPacks.length,
    },
    ...existing
      .filter((l) => l.type !== "PACK")
      .map((l, i) => ({
        type: l.type,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountPercent: l.discountPercent,
        sortOrder: otherPacks.length + 1 + i,
      })),
  ];

  await prisma.quote.update({
    where: { id: quoteId },
    data: { packId },
  });
  await syncQuoteLines(quoteId, lines);
  revalidateQuotePaths(quoteId, quote.contactId);
  return { ok: true };
}

export { planById, catalogPriceForPack, computeQuoteTotal };
