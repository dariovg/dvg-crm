import { t } from "./i18n";

const STATUS_IDS = [
  "NEW",
  "CONTACTED",
  "MEETING_SCHEDULED",
  "MEETING_DONE",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];

const SOURCE_IDS = ["WEB_CHAT", "BOOKING", "SURVEY", "MANUAL"];

const PRIORITY_IDS = ["HIGH", "MEDIUM", "LOW"];

export function contactStatusLabel(id, locale = "es") {
  return t(`status.${id}`, locale) || id;
}

export function sourceLabel(id, locale = "es") {
  return t(`source.${id}`, locale) || id;
}

export function taskPriorityLabel(id, locale = "es") {
  return t(`priority.${id}`, locale) || id;
}

export function contactStatusesForLocale(locale = "es") {
  return STATUS_IDS.map((id) => ({ id, label: contactStatusLabel(id, locale) }));
}

export function sourceLabelsForLocale(locale = "es") {
  return SOURCE_IDS.map((id) => ({ id, label: sourceLabel(id, locale) }));
}

export function taskPrioritiesForLocale(locale = "es") {
  return PRIORITY_IDS.map((id) => ({ id, label: taskPriorityLabel(id, locale) }));
}
