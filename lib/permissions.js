export function isAdmin(session) {
  return session?.user?.role === "ADMIN";
}

/** Filtro Prisma para contactos según rol. */
export function contactScope(session) {
  if (isAdmin(session)) return {};
  const id = session?.user?.id;
  if (!id || id === "env-admin") return { id: "__none__" };
  return { assigneeId: id };
}

/** Filtro Prisma para tareas según rol. */
export function taskScope(session) {
  if (isAdmin(session)) return {};
  const id = session?.user?.id;
  if (!id || id === "env-admin") return { assigneeId: "__none__" };
  return { assigneeId: id };
}

export function canAccessContact(session, contact) {
  if (isAdmin(session)) return true;
  return contact?.assigneeId === session?.user?.id;
}

export function canAccessTask(session, task) {
  if (isAdmin(session)) return true;
  return task?.assigneeId === session?.user?.id;
}
