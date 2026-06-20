import Link from "next/link";
import { KIND_LABEL } from "@/lib/lead-timeline";

export default function RecentActivityFeed({ items }) {
  if (!items?.length) {
    return (
      <p className="activity-feed-empty">Sin actividad reciente en tus leads.</p>
    );
  }

  return (
    <ul className="activity-feed">
      {items.map((item) => (
        <li key={`${item.contactId}-${item.id}`} className="activity-feed-item">
          <div className="activity-feed-head">
            <span className={`timeline-kind timeline-kind--${item.kind}`}>
              {KIND_LABEL[item.kind] || item.kind}
            </span>
            <time dateTime={item.at.toISOString()}>
              {item.at.toLocaleString("es-ES", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </div>
          <Link href={`/leads/${item.contactId}`} className="activity-feed-lead">
            {item.contactName}
          </Link>
          <div className="activity-feed-title">{item.title}</div>
          {item.summary && (
            <div className="activity-feed-summary">{item.summary}</div>
          )}
        </li>
      ))}
    </ul>
  );
}
