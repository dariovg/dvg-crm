"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireAuthSession,
  requireAdminSession,
} from "@/lib/auth-server";
import {
  canAccessContact,
  canAccessTask,
  contactScope,
} from "@/lib/permissions";

async function getContactForUser(session, contactId) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
  });
  if (!contact || !canAccessContact(session, contact)) {
    throw new Error("No autorizado");
  }
  return contact;
}

export async function updateContactStatus(contactId, status) {
  const session = await requireAuthSession();
  await getContactForUser(session, contactId);
  await prisma.contact.update({
    where: { id: contactId },
    data: { status },
  });
  await prisma.contactEvent.create({
    data: {
      contactId,
      type: "status_changed",
      summary: `Estado cambiado a ${status}`,
      userId: session.user.id !== "env-admin" ? session.user.id : null,
    },
  });
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  revalidatePath(`/leads/${contactId}`);
}

export async function assignContact(contactId, assigneeId) {
  const session = await requireAdminSession();
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
      userId: session.user.id !== "env-admin" ? session.user.id : null,
    },
  });
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  revalidatePath(`/leads/${contactId}`);
}

export async function updateContactNotes(contactId, notes) {
  const session = await requireAuthSession();
  await getContactForUser(session, contactId);
  await prisma.contact.update({
    where: { id: contactId },
    data: { notes },
  });
  await prisma.contactEvent.create({
    data: {
      contactId,
      type: "note_updated",
      summary: "Notas actualizadas",
      userId: session.user.id !== "env-admin" ? session.user.id : null,
    },
  });
  revalidatePath(`/leads/${contactId}`);
}

export async function createTask(contactId, title, dueAt, assigneeId) {
  const session = await requireAuthSession();
  await getContactForUser(session, contactId);
  const targetAssignee =
    session.user.role === "ADMIN" && assigneeId
      ? assigneeId
      : session.user.id !== "env-admin"
        ? session.user.id
        : null;

  await prisma.task.create({
    data: {
      contactId,
      title,
      dueAt: dueAt ? new Date(dueAt) : null,
      assigneeId: targetAssignee,
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

export async function updateTask(taskId, { title, dueAt, assigneeId, done }) {
  const session = await requireAuthSession();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || !canAccessTask(session, task)) throw new Error("No autorizado");

  const data = {};
  if (title != null) data.title = title;
  if (dueAt !== undefined) data.dueAt = dueAt ? new Date(dueAt) : null;
  if (done != null) data.done = done;
  if (session.user.role === "ADMIN" && assigneeId !== undefined) {
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
