import { QUOTE_STATUS_LABEL } from "@/lib/quotes";

const colors = {
  DRAFT: "quote-badge--draft",
  PENDING_APPROVAL: "quote-badge--pending",
  APPROVED: "quote-badge--approved",
  SENT: "quote-badge--sent",
  ACCEPTED: "quote-badge--accepted",
  REJECTED: "quote-badge--rejected",
};

export default function QuoteStatusBadge({ status }) {
  return (
    <span className={`quote-badge ${colors[status] || ""}`}>
      {QUOTE_STATUS_LABEL[status] || status}
    </span>
  );
}
