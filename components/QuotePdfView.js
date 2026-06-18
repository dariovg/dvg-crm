import Image from "next/image";
import {
  computeLineTotal,
  computeQuoteSubtotal,
  computeQuoteTotal,
  FOOTER_TEXT,
  QUOTE_BILLING_LABEL,
} from "@/lib/quotes";
import { formatEuro } from "@/lib/pricing-catalog";

export default function QuotePdfView({ quote }) {
  const subtotal = computeQuoteSubtotal(quote.lines);
  const total = computeQuoteTotal(quote, quote.lines);
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
          <Image
            src="/logo-dvg-studio.svg"
            alt="DVG Studio"
            width={220}
            height={35}
            priority
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
            <th>Importe</th>
          </tr>
        </thead>
        <tbody>
          {quote.lines.map((line) => (
            <tr key={line.id}>
              <td>
                <pre className="quote-pdf-line-desc">{line.description}</pre>
              </td>
              <td>{line.quantity}</td>
              <td>{formatEuro(line.unitPrice)}</td>
              <td>{line.discountPercent ? `${line.discountPercent}%` : "—"}</td>
              <td>{formatEuro(computeLineTotal(line))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="quote-pdf-totals">
        <div>
          <span>Subtotal</span>
          <span>{formatEuro(subtotal)}</span>
        </div>
        {quote.discountPercent ? (
          <div>
            <span>Descuento global ({quote.discountPercent}%)</span>
            <span>−{formatEuro(Math.round(subtotal * (quote.discountPercent / 100)))}</span>
          </div>
        ) : null}
        <div className="quote-pdf-total-final">
          <span>
            Total {quote.billing === "ANNUAL" ? "mensual (compromiso anual)" : "mensual"}
          </span>
          <strong>{formatEuro(total)}</strong>
        </div>
        <p className="quote-pdf-iva">Importes sin IVA (21% no incluido)</p>
      </div>

      {quote.notes && (
        <section className="quote-pdf-notes">
          <h2>Observaciones</h2>
          <p>{quote.notes}</p>
        </section>
      )}

      <footer className="quote-pdf-footer">
        <pre>{FOOTER_TEXT}</pre>
      </footer>
    </div>
  );
}
