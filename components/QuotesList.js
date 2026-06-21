import Link from "next/link";
import QuoteStatusBadge from "@/components/QuoteStatusBadge";
import QuoteDeleteButton from "@/components/QuoteDeleteButton";
import EmptyState from "@/components/EmptyState";
import { computeQuoteTotalWithVat } from "@/lib/quotes";
import { formatEuro } from "@/lib/pricing-catalog";

export default function QuotesList({
  quotes,
  showContact = true,
  isAdmin = false,
  canDelete = false,
  contactId,
}) {
  const newQuoteHref = contactId
    ? `/presupuestos/nuevo?contactId=${contactId}`
    : "/presupuestos/nuevo";

  if (!quotes.length) {
    return (
      <EmptyState
        className="empty-state-card--wide"
        icon="presupuestos"
        title="Sin presupuestos"
        description={
          contactId
            ? "Crea el primer presupuesto para este lead."
            : "Crea el primer presupuesto para un lead del pipeline."
        }
        actionLabel="Nuevo presupuesto"
        actionHref={newQuoteHref}
      />
    );
  }

  const showActions = isAdmin || canDelete;

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
            {showActions && <th className="th-actions">Acciones</th>}
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
              <td>{formatEuro(computeQuoteTotalWithVat(q, q.lines))}</td>
              <td>{new Date(q.createdAt).toLocaleDateString("es-ES")}</td>
              {showActions && (
                <td className="quote-actions-cell td-actions">
                  <Link href={`/presupuestos/${q.id}`} className="btn-link-sm">
                    Abrir
                  </Link>
                  {isAdmin && q.status === "PENDING_APPROVAL" && (
                    <Link href={`/presupuestos/${q.id}`} className="btn-link-sm">
                      Revisar
                    </Link>
                  )}
                  {canDelete && (
                    <QuoteDeleteButton quoteId={q.id} quoteNumber={q.number} />
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
