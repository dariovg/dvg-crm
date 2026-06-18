import { STATUS_LABEL } from "@/lib/constants";

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
  return (
    <span className={`status-badge ${colors[status] || ""}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}
