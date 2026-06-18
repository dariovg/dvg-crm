"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("No autorizado");
  return session;
}

export async function updateContactStatus(contactId, status) {
  const session = await requireSession();
  await prisma.contact.update({
    where: { id: contactId },
    data: { status },
  });
  await prisma.contactEvent.create({
    data: {
      contactId,
      type: "status_changed",
      summary: `Estado cambiado a ${status}`,
      userId: session.user.id,
    },
  });
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${contactId}`);
}

export async function updateContactNotes(contactId, notes) {
  const session = await requireSession();
  await prisma.contact.update({
    where: { id: contactId },
    data: { notes },
  });
  await prisma.contactEvent.create({
    data: {
      contactId,
      type: "note_updated",
      summary: "Notas actualizadas",
      userId: session.user.id,
    },
  });
  revalidatePath(`/leads/${contactId}`);
}

export async function createTask(contactId, title, dueAt) {
  const session = await requireSession();
  await prisma.task.create({
    data: {
      contactId,
      title,
      dueAt: dueAt ? new Date(dueAt) : null,
      assigneeId: session.user.id,
    },
  });
  revalidatePath("/tasks");
  revalidatePath(`/leads/${contactId}`);
}

export async function toggleTask(taskId, done) {
  await requireSession();
  await prisma.task.update({
    where: { id: taskId },
    data: { done },
  });
  revalidatePath("/tasks");
}
