import Link from "next/link";
import QuotesList from "@/components/QuotesList";

export default function ContactQuotes({ contactId, quotes, isAdmin, canDelete = false }) {
  return (
    <div className="card">
      <div className="card-header-row">
        <h2>Presupuestos</h2>
        <Link href={`/presupuestos/nuevo?contactId=${contactId}`} className="btn-primary btn-sm">
          Nuevo presupuesto
        </Link>
      </div>
      <QuotesList
        quotes={quotes}
        showContact={false}
        isAdmin={isAdmin}
        canDelete={canDelete}
        contactId={contactId}
      />
    </div>
  );
}
