"use client";

import { useState } from "react";
import { absolutePublicQuoteUrl, absolutePublicSignUrl } from "@/lib/quote-share";

function formatWhen(d) {
  if (!d) return null;
  return new Date(d).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function QuoteSharePanel({ quote }) {
  const [copied, setCopied] = useState(null);

  if (!quote.shareToken) {
    return (
      <p className="quote-share-hint">
        El enlace público se generará al marcar el presupuesto como enviado.
      </p>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const viewUrl = absolutePublicQuoteUrl(quote.shareToken, origin);
  const signUrl = absolutePublicSignUrl(quote.shareToken, origin);

  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="quote-share-panel">
      <div className="quote-share-links">
        <div className="quote-share-row">
          <label>Vista cliente (PDF)</label>
          <div className="quote-share-copy">
            <input type="text" readOnly value={viewUrl} />
            <button type="button" className="btn-secondary btn-sm" onClick={() => copy(viewUrl, "view")}>
              {copied === "view" ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>
        {quote.status === "SENT" && !quote.signedAt && (
          <div className="quote-share-row">
            <label>Enlace para firmar</label>
            <div className="quote-share-copy">
              <input type="text" readOnly value={signUrl} />
              <button type="button" className="btn-secondary btn-sm" onClick={() => copy(signUrl, "sign")}>
                {copied === "sign" ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="quote-tracking-stats">
        <h4>Seguimiento de apertura</h4>
        {quote.pdfOpenCount > 0 ? (
          <ul className="quote-tracking-list">
            <li>
              <strong>{quote.pdfOpenCount}</strong>{" "}
              {quote.pdfOpenCount === 1 ? "apertura" : "aperturas"}
            </li>
            {quote.pdfFirstOpenedAt && (
              <li>Primera: {formatWhen(quote.pdfFirstOpenedAt)}</li>
            )}
            {quote.pdfLastOpenedAt && quote.pdfOpenCount > 1 && (
              <li>Última: {formatWhen(quote.pdfLastOpenedAt)}</li>
            )}
          </ul>
        ) : (
          <p className="quote-share-hint">El cliente aún no ha abierto el enlace del PDF.</p>
        )}
      </div>

      {quote.signedAt && (
        <div className="quote-signature-summary">
          <h4>Firma del cliente</h4>
          <p>
            Firmado por <strong>{quote.signedByName || "Cliente"}</strong> el{" "}
            {formatWhen(quote.signedAt)}
          </p>
          {quote.clientSignature?.startsWith("data:image") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={quote.clientSignature} alt="Firma del cliente" className="quote-signature-preview" />
          )}
        </div>
      )}
    </div>
  );
}
