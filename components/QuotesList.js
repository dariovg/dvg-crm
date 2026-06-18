import Link from "next/link";
import QuoteStatusBadge from "@/components/QuoteStatusBadge";
import { computeQuoteTotal } from "@/lib/quotes";
import { formatEuro } from "@/lib/pricing-catalog";

export default function QuotesList({ quotes, showContact = true, isAdmin = false }) {
  if (!quotes.length) {
    return <p className="empty-hint">No hay presupuestos todavía.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Número</th>
            {showContact && <th>Cliente</th>}
            <th>Estado</th>
            <th>Total</th>
            <th>Fecha</th>
            {isAdmin && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <tr key={q.id}>
              <td>
                <Link href={`/presupuestos/${q.id}`}>{q.number}</Link>
              </td>
              {showContact && (
                <td>
                  <Link href={`/leads/${q.contact.id}`}>{q.contact.name}</Link>
                  {q.contact.company && (
                    <div className="table-sub">{q.contact.company}</div>
                  )}
                </td>
              )}
              <td>
                <QuoteStatusBadge status={q.status} />
              </td>
              <td>{formatEuro(computeQuoteTotal(q, q.lines))}</td>
              <td>{new Date(q.createdAt).toLocaleDateString("es-ES")}</td>
              {isAdmin && (
                <td className="quote-actions-cell">
                  {q.status === "PENDING_APPROVAL" && (
                    <Link href={`/presupuestos/${q.id}`} className="btn-link-sm">
                      Revisar
                    </Link>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
