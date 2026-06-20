"use client";

import Link from "next/link";

export default function PublicQuoteToolbar({ token, canSign }) {
  return (
    <div className="quote-pdf-toolbar no-print quote-public-toolbar">
      {canSign && (
        <Link href={`/p/${token}/firmar`} className="btn-primary">
          Aceptar y firmar
        </Link>
      )}
      <button type="button" className="btn-secondary" onClick={() => window.print()}>
        Descargar / Imprimir PDF
      </button>
    </div>
  );
}
