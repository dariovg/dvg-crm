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
  contactScope,
  isStaff,
} from "@/lib/permissions";

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
  }
  revalidatePath("/leads");
  revalidatePath("/pipeline");
}

export async function updateContactNotes(contactId, notes) {
  return updateContactDetails(contactId, { notes });
}

export async function createTask(contactId, title, dueAt, assigneeId, priority) {
  const session = await requireAuthSession();
  await getContactForUser(session, contactId);
  const targetAssignee =
    isStaff(session) && assigneeId
      ? assigneeId
      : actorId(session);

  await prisma.task.create({
    data: {
      contactId,
      title,
      dueAt: dueAt ? new Date(dueAt) : null,
      assigneeId: targetAssignee,
      priority: priority || "MEDIUM",
    },
  });
  revalidatePath("/tasks");
  revalidatePath(`/leads/${contactId}`);
}

export async function toggleTask(taskId, done) {
  const session = await requireAuthSession();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || !canAccessTask(session, task)) throw new Error("No autorizado");
  await prisma.task.update({
    where: { id: taskId },
    data: { done },
  });
  revalidatePath("/tasks");
}

export async function updateTask(taskId, { title, dueAt, assigneeId, done, priority }) {
  const session = await requireAuthSession();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || !canAccessTask(session, task)) throw new Error("No autorizado");

  const data = {};
  if (title != null) data.title = title;
  if (dueAt !== undefined) data.dueAt = dueAt ? new Date(dueAt) : null;
  if (done != null) data.done = done;
  if (priority != null) data.priority = priority;
  if (isStaff(session) && assigneeId !== undefined) {
    data.assigneeId = assigneeId || null;
  }

  await prisma.task.update({ where: { id: taskId }, data });
  revalidatePath("/tasks");
  revalidatePath(`/leads/${task.contactId}`);
}

export async function deleteTask(taskId) {
  const session = await requireAuthSession();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || !canAccessTask(session, task)) throw new Error("No autorizado");
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/tasks");
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

  return prisma.contact.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      assignee: { select: { id: true, email: true, name: true, role: true } },
      meetings: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
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
  await requireAdminSession();
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) throw new Error("Email y contraseña obligatorios");
  if (!["MEMBER", "MANAGER"].includes(role)) throw new Error("Rol no válido");

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
  revalidatePath("/admin/users");
}

export async function updateTeamUser(userId, { name, role }) {
  await requireAdminSession();
  if (role && !["MEMBER", "MANAGER", "ADMIN"].includes(role)) {
    throw new Error("Rol no válido");
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name != null ? { name: name.trim() } : {}),
      ...(role ? { role } : {}),
    },
  });
  revalidatePath("/admin/users");
}
