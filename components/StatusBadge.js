"use client";

import { useLocale } from "@/components/LocaleProvider";
import { contactStatusLabel } from "@/lib/i18n-labels";

const colors = {
  NEW: "badge-new",
  CONTACTED: "badge-contacted",
  MEETING_SCHEDULED: "badge-meeting",
  MEETING_DONE: "badge-done",
  PROPOSAL: "badge-proposal",
  NEGOTIATION: "badge-negotiation",
  WON: "badge-won",
  LOST: "badge-lost",
};

export default function StatusBadge({ status }) {
  const { locale } = useLocale();
  return (
    <span className={`status-badge ${colors[status] || ""}`}>
      {contactStatusLabel(status, locale)}
    </span>
  );
}
