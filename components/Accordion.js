"use client";

import { useId, useState } from "react";

export default function Accordion({
  title,
  subtitle,
  defaultOpen = false,
  children,
  badge,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className={`accordion${open ? " accordion--open" : ""}`}>
      <button
        type="button"
        className="accordion-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="accordion-trigger-text">
          <span className="accordion-title">{title}</span>
          {subtitle && <span className="accordion-subtitle">{subtitle}</span>}
        </span>
        {badge != null && <span className="accordion-badge">{badge}</span>}
        <span className="accordion-chevron" aria-hidden />
      </button>
      <div id={panelId} className="accordion-panel" hidden={!open}>
        <div className="accordion-panel-inner">{children}</div>
      </div>
    </section>
  );
}
