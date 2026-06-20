import Link from "next/link";
import { buildLeadTimeline, KIND_LABEL } from "@/lib/lead-timeline";
import EmptyState from "@/components/EmptyState";

function TimelineLink({ href, label, external }) {
  if (!href) return null;
  if (external || href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="timeline-entry-link">
        {label || "Ver"}
      </a>
    );
  }
  return (
    <Link href={href} className="timeline-entry-link">
      {label || "Ver"}
    </Link>
  );
}

export default function LeadTimeline({ contact }) {
  const items = buildLeadTimeline(contact);

  if (items.length === 0) {
    return (
      <EmptyState
        title="Sin actividad"
        description="Las notas, cambios de estado y tareas aparecerán aquí."
        className="empty-state-card--compact"
      />
    );
  }

  return (
    <ul className="timeline timeline--unified">
      {items.map((item) => (
        <li key={item.id} className="timeline-entry">
          <div className="timeline-entry-head">
            <span className={`timeline-kind timeline-kind--${item.kind}`}>
              {KIND_LABEL[item.kind] || item.kind}
            </span>
            <time dateTime={item.at.toISOString()}>
              {item.at.toLocaleString("es-ES")}
            </time>
          </div>
          <div className="timeline-entry-title">{item.title}</div>
          <div className="timeline-entry-summary">{item.summary}</div>
          {item.detail && (
            <div className="timeline-entry-detail">{item.detail}</div>
          )}
          {item.actor && (
            <div className="timeline-user">por {item.actor}</div>
          )}
          <TimelineLink
            href={item.link}
            label={item.linkLabel}
            external={item.external}
          />
        </li>
      ))}
    </ul>
  );
}
