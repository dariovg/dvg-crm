import {
  computeLineTotal,
  computeLineVat,
  computeQuoteSubtotal,
  computeQuoteTotal,
  computeQuoteVat,
  computeQuoteTotalWithVat,
  FOOTER_TEXT,
  QUOTE_BILLING_LABEL,
  VAT_RATE,
} from "@/lib/quotes";
import { formatEuro } from "@/lib/pricing-catalog";

export default function QuotePdfView({ quote, showSignature = false, trackingPixel = null }) {
  const subtotal = computeQuoteSubtotal(quote.lines);
  const baseTotal = computeQuoteTotal(quote, quote.lines);
  const vatTotal = computeQuoteVat(quote, quote.lines);
  const grandTotal = computeQuoteTotalWithVat(quote, quote.lines);
  const vatPercent = Math.round(VAT_RATE * 100);
  const issued = new Date(quote.createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const validUntil = quote.validUntil
    ? new Date(quote.validUntil).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="quote-pdf">
      <header className="quote-pdf-header">
        <div className="quote-pdf-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-dvg-studio.png"
            alt="DVG Studio — hacIA lo imparable"
            width={220}
            height={35}
            className="quote-pdf-logo"
          />
          <p className="quote-pdf-tagline">Agente de IA · Webs y apps</p>
        </div>
        <div className="quote-pdf-doc">
          <h1>PRESUPUESTO</h1>
          <p>
            <strong>{quote.number}</strong>
          </p>
          <p>Fecha: {issued}</p>
          {validUntil && <p>Válido hasta: {validUntil}</p>}
        </div>
      </header>

      <section className="quote-pdf-parties">
        <div>
          <h2>Cliente</h2>
          <p>
            <strong>{quote.contact.name}</strong>
          </p>
          {quote.contact.company && <p>{quote.contact.company}</p>}
          <p>{quote.contact.email}</p>
          {quote.contact.phone && <p>{quote.contact.phone}</p>}
        </div>
        <div>
          <h2>Emisor</h2>
          <p>
            <strong>DVG Studio</strong>
          </p>
          <p>info@dvgsstudio.com</p>
          <p>www.dvgsstudio.com</p>
        </div>
      </section>

      <p className="quote-pdf-billing-note">{QUOTE_BILLING_LABEL[quote.billing]}</p>

      <table className="quote-pdf-table">
        <thead>
          <tr>
            <th>Concepto</th>
            <th>Cant.</th>
            <th>Precio unit.</th>
            <th>Dto.</th>
            <th>Base</th>
            <th>IVA {vatPercent}%</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {quote.lines.map((line) => {
            const lineBase = computeLineTotal(line);
            const lineVat = computeLineVat(line);
            return (
              <tr key={line.id}>
                <td>
                  <pre className="quote-pdf-line-desc">{line.description}</pre>
                </td>
                <td>{line.quantity}</td>
                <td>{formatEuro(line.unitPrice)}</td>
                <td>{line.discountPercent ? `${line.discountPercent}%` : "—"}</td>
                <td>{formatEuro(lineBase)}</td>
                <td>{formatEuro(lineVat)}</td>
                <td>{formatEuro(lineBase + lineVat)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="quote-pdf-totals">
        <div>
          <span>Subtotal (base imponible)</span>
          <span>{formatEuro(subtotal)}</span>
        </div>
        {quote.discountPercent ? (
          <div>
            <span>Descuento global ({quote.discountPercent}%)</span>
            <span>−{formatEuro(Math.round(subtotal * (quote.discountPercent / 100)))}</span>
          </div>
        ) : null}
        <div>
          <span>Base imponible</span>
          <span>{formatEuro(baseTotal)}</span>
        </div>
        <div>
          <span>IVA ({vatPercent}%)</span>
          <span>{formatEuro(vatTotal)}</span>
        </div>
        <div className="quote-pdf-total-final">
          <span>
            Total {quote.billing === "ANNUAL" ? "mensual (compromiso anual)" : "mensual"} con IVA
          </span>
          <strong>{formatEuro(grandTotal)}</strong>
        </div>
      </div>

      {quote.notes && (
        <section className="quote-pdf-notes">
          <h2>Observaciones</h2>
          <p>{quote.notes}</p>
        </section>
      )}

      {showSignature && quote.signedAt && (
        <section className="quote-pdf-signature">
          <h2>Aceptación del cliente</h2>
          <p>
            Firmado por <strong>{quote.signedByName || quote.contact.name}</strong> el{" "}
            {new Date(quote.signedAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          {quote.clientSignature?.startsWith("data:image") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={quote.clientSignature}
              alt="Firma"
              className="quote-pdf-signature-img"
            />
          ) : quote.signedByName ? (
            <p className="quote-pdf-signature-typed">{quote.signedByName}</p>
          ) : null}
        </section>
      )}

      {trackingPixel && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={trackingPixel} alt="" width={1} height={1} className="quote-track-pixel" />
      )}

      <footer className="quote-pdf-footer">
        <pre>{FOOTER_TEXT}</pre>
      </footer>
    </div>
  );
}
