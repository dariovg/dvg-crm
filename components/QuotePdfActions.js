"use client";

import Link from "next/link";
import QuoteSharePanel from "@/components/QuoteSharePanel";

export default function QuotePdfActions({ quoteId, quote }) {
  return (
    <div className="quote-pdf-toolbar no-print">
      <Link href={`/presupuestos/${quoteId}`} className="btn-secondary">
        ← Volver al editor
      </Link>
      <button type="button" className="btn-primary" onClick={() => window.print()}>
        Descargar / Imprimir PDF
      </button>
      {quote?.shareToken && (
        <div className="quote-pdf-share-inline">
          <QuoteSharePanel quote={quote} />
        </div>
      )}
    </div>
  );
}
