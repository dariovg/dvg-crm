export const CONTACT_STATUSES = [
  { id: "NEW", label: "Nuevo" },
  { id: "CONTACTED", label: "Contactado" },
  { id: "MEETING_SCHEDULED", label: "Reunión agendada" },
  { id: "MEETING_DONE", label: "Reunión hecha" },
  { id: "PROPOSAL", label: "Propuesta enviada" },
  { id: "NEGOTIATION", label: "En negociación" },
  { id: "WON", label: "Cliente" },
  { id: "LOST", label: "Perdido" },
];

export const STATUS_LABEL = Object.fromEntries(
  CONTACT_STATUSES.map((s) => [s.id, s.label])
);

export const SOURCE_LABEL = {
  WEB_CHAT: "Chat web",
  BOOKING: "Cita",
  SURVEY: "Encuesta",
  MANUAL: "Manual",
};

export const TASK_PRIORITIES = [
  { id: "HIGH", label: "Alta" },
  { id: "MEDIUM", label: "Media" },
  { id: "LOW", label: "Baja" },
];

export const LOST_REASONS = [
  "Precio",
  "Timing / no es el momento",
  "Eligió competencia",
  "Sin respuesta",
  "No encaja el servicio",
  "Otro",
];

export const FUNNEL_STAGES = [
  "NEW",
  "CONTACTED",
  "MEETING_SCHEDULED",
  "MEETING_DONE",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
];
