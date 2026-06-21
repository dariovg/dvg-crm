import Link from "next/link";
import { fetchScopedQuotes } from "@/app/actions";
import QuotesList from "@/components/QuotesList";
import { getAuthSession } from "@/lib/auth-server";
import { isAdmin, isStaff } from "@/lib/permissions";

export default async function PresupuestosPage({ searchParams }) {
  const params = await searchParams;
  const session = await getAuthSession();
  const staff = isStaff(session);
  const admin = isAdmin(session);
  const statusFilter = params?.status || "";

  const quotes = await fetchScopedQuotes(
    statusFilter ? { status: statusFilter } : {}
  );

  const pendingCount = quotes.filter((q) => q.status === "PENDING_APPROVAL").length;

  return (
    <>
      <h1 className="page-title">Presupuestos</h1>
      <p className="page-lead">
        {quotes.length} presupuestos
        {staff ? " · Vista global" : " · Tus leads y presupuestos"}
        {admin && pendingCount > 0 && (
          <> · <strong>{pendingCount} pendientes de aprobación</strong></>
        )}
      </p>

      <div className="quote-filters">
        <Link
          href="/presupuestos"
          className={`filter-chip${!statusFilter ? " filter-chip--active" : ""}`}
        >
          Todos
        </Link>
        <Link
          href="/presupuestos?status=DRAFT"
          className={`filter-chip${statusFilter === "DRAFT" ? " filter-chip--active" : ""}`}
        >
          Borradores
        </Link>
        {admin && (
          <Link
            href="/presupuestos?status=PENDING_APPROVAL"
            className={`filter-chip${statusFilter === "PENDING_APPROVAL" ? " filter-chip--active" : ""}`}
          >
            Pendientes ({pendingCount})
          </Link>
        )}
        <Link
          href="/presupuestos?status=SENT"
          className={`filter-chip${statusFilter === "SENT" ? " filter-chip--active" : ""}`}
        >
          Enviados
        </Link>
        <Link
          href="/presupuestos?status=ACCEPTED"
          className={`filter-chip${statusFilter === "ACCEPTED" ? " filter-chip--active" : ""}`}
        >
          Aceptados
        </Link>
      </div>

      <QuotesList quotes={quotes} isAdmin={admin} canDelete={staff} />
    </>
  );
}
