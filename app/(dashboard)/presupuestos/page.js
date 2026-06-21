import { fetchScopedQuotes } from "@/app/actions";
import QuotesList from "@/components/QuotesList";
import QuotesPageHeader from "@/components/QuotesPageHeader";
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
      <QuotesPageHeader
        count={quotes.length}
        staff={staff}
        admin={admin}
        pendingCount={pendingCount}
        statusFilter={statusFilter}
      />
      <QuotesList quotes={quotes} isAdmin={admin} canDelete={staff} />
    </>
  );
}
