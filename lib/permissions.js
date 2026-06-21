export function isAdmin(session) {
  return session?.user?.role === "ADMIN";
}

export function isManager(session) {
  return session?.user?.role === "MANAGER";
}

/** Admin o manager: ven todo el CRM operativo. */
export function isStaff(session) {
  return isAdmin(session) || isManager(session);
}

/** Filtro Prisma para contactos según rol. */
export function contactScope(session) {
  if (isStaff(session)) return {};
  const id = session?.user?.id;
  if (!id || id === "env-admin") return { id: "__none__" };
  return { assigneeId: id };
}

/** Filtro Prisma para tareas según rol. */
export function taskScope(session) {
  if (isStaff(session)) return {};
  const id = session?.user?.id;
  if (!id || id === "env-admin") return { assigneeId: "__none__" };
  return { assigneeId: id };
}

export function canAccessContact(session, contact) {
  if (isStaff(session)) return true;
  return contact?.assigneeId === session?.user?.id;
}

export function canAccessTask(session, task) {
  if (isStaff(session)) return true;
  return task?.assigneeId === session?.user?.id;
}

export function canAssignContacts(session) {
  return isStaff(session);
}

/** Solo admin/manager pueden eliminar leads. */
export function canDeleteContact(session) {
  return isStaff(session);
}

/** Admin y manager pueden eliminar presupuestos. */
export function canDeleteQuote(session) {
  return isStaff(session);
}

export function canManageUsers(session) {
  return isAdmin(session);
}

export function canCreateQuote(session) {
  return !!session?.user?.id;
}

export function canApproveQuote(session) {
  return isAdmin(session);
}

/** Filtro Prisma para presupuestos según rol. */
export function quoteScope(session) {
  if (isStaff(session)) return {};
  const id = session?.user?.id;
  if (!id || id === "env-admin") return { id: "__none__" };
  return {
    OR: [{ createdById: id }, { contact: { assigneeId: id } }],
  };
}

export function canAccessQuote(session, quote) {
  if (isStaff(session)) return true;
  if (quote?.createdById === session?.user?.id) return true;
  if (quote?.contact?.assigneeId === session?.user?.id) return true;
  return false;
}

export function canEditQuote(session, quote) {
  return canAccessQuote(session, quote);
}

export function isMarketing(session) {
  return session?.user?.role === "MARKETING";
}

/** Admin o rol Marketing: acceso al módulo de redes. */
export function canAccessMarketing(session) {
  return isAdmin(session) || isMarketing(session);
}

/** Admin, manager o miembro: acceso al CRM comercial (no marketing). */
export function canAccessSalesCrm(session) {
  const role = session?.user?.role;
  return role === "ADMIN" || role === "MANAGER" || role === "MEMBER";
}

/** Ruta de inicio según rol. */
export function getDefaultHomeForRole(role) {
  if (role === "MARKETING") return "/marketing";
  return "/dashboard";
}

/** Solo admin aprueba/rechaza posts (fase 1). */
export function canApproveMarketingPosts(session) {
  return isAdmin(session);
}

/** Solo admin conecta cuentas externas (OAuth). */
export function canConnectMarketingAccounts(session) {
  return isAdmin(session);
}
