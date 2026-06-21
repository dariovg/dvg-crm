/** Estados de presencia visibles para el equipo. */

export const PRESENCE_STATUSES = [
  "AVAILABLE",
  "REMOTE",
  "BUSY",
  "AWAY",
  "VACATION",
];

export const PRESENCE_LABELS = {
  es: {
    AVAILABLE: "Disponible",
    REMOTE: "Remoto",
    BUSY: "Ocupado",
    AWAY: "Ausente",
    VACATION: "Vacaciones",
  },
  en: {
    AVAILABLE: "Available",
    REMOTE: "Remote",
    BUSY: "Busy",
    AWAY: "Away",
    VACATION: "On vacation",
  },
};

export const PRESENCE_COLORS = {
  AVAILABLE: "#22c55e",
  REMOTE: "#3b82f6",
  BUSY: "#ef4444",
  AWAY: "#f59e0b",
  VACATION: "#a855f7",
};

export function presenceLabel(status, locale = "es") {
  const key = PRESENCE_LABELS[locale]?.[status] ?? PRESENCE_LABELS.es[status];
  return key || PRESENCE_LABELS.es.AVAILABLE;
}

export function normalizePresenceStatus(status) {
  return PRESENCE_STATUSES.includes(status) ? status : "AVAILABLE";
}
