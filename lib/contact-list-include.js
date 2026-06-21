/** Include mínimo para listas (leads, pipeline) — sin joins pesados. */
export const CONTACT_LIST_INCLUDE = {
  assignee: { select: { id: true, email: true, name: true, role: true } },
};

export const CONTACT_LIST_SELECT = {
  id: true,
  name: true,
  email: true,
  company: true,
  status: true,
  source: true,
  dealValue: true,
  assigneeId: true,
  createdAt: true,
  updatedAt: true,
};
