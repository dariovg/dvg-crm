"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  buildLeadTimeline,
  filterTimelineByKind,
  KIND_LABEL,
  TIMELINE_KINDS,
} from "@/lib/lead-timeline";
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
  const allItems = useMemo(() => buildLeadTimeline(contact), [contact]);
  const [kind, setKind] = useState("all");

  const presentKinds = useMemo(() => {
    const set = new Set(allItems.map((i) => i.kind));
    return TIMELINE_KINDS.filter((k) => set.has(k.id));
  }, [allItems]);

  const items = filterTimelineByKind(allItems, kind);

  if (allItems.length === 0) {
    return (
      <EmptyState
        title="Sin actividad"
        description="Las notas, cambios de estado y tareas aparecerán aquí."
        className="empty-state-card--compact"
      />
    );
  }

  return (
    <>
      {presentKinds.length > 1 && (
        <div className="timeline-filters" role="tablist" aria-label="Filtrar actividad">
          <button
            type="button"
            className={`timeline-filter${kind === "all" ? " timeline-filter--active" : ""}`}
            onClick={() => setKind("all")}
          >
            Todo
          </button>
          {presentKinds.map((k) => (
            <button
              key={k.id}
              type="button"
              className={`timeline-filter timeline-filter--${k.id}${kind === k.id ? " timeline-filter--active" : ""}`}
              onClick={() => setKind(k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="timeline-filter-empty">Sin actividad de este tipo.</p>
      ) : (
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
      )}
    </>
  );
}
