"use client";

import Link from "next/link";

export default function QuotePdfActions({ quoteId }) {
  return (
    <div className="quote-pdf-toolbar no-print">
      <Link href={`/presupuestos/${quoteId}`} className="btn-secondary">
        ← Volver al editor
      </Link>
      <button type="button" className="btn-primary" onClick={() => window.print()}>
        Descargar / Imprimir PDF
      </button>
    </div>
  );
}
