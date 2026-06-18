import { Suspense } from "react";
import { fetchScopedContacts } from "@/app/actions";
import { getAuthSession, listTeamUsers } from "@/lib/auth-server";
import { isAdmin } from "@/lib/permissions";
import LeadsFilters, { LeadsTable } from "@/components/LeadsTable";

export default async function LeadsPage({ searchParams }) {
  const params = await searchParams;
  const session = await getAuthSession();
  const admin = isAdmin(session);
  const team = admin ? await listTeamUsers() : [];

  const contacts = await fetchScopedContacts({
    status: params.status || undefined,
    source: params.source || undefined,
    assigneeId: params.assignee || undefined,
    q: params.q || undefined,
  });

  return (
    <>
      <h1 className="page-title">Leads</h1>
      <p className="page-lead">
        {contacts.length} contacto{contacts.length !== 1 ? "s" : ""}
        {admin ? " · Vista global" : " · Asignados a ti"}
      </p>

      <Suspense fallback={<div className="filters-bar">Cargando filtros…</div>}>
        <LeadsFilters team={team} isAdmin={admin} />
      </Suspense>

      <LeadsTable contacts={contacts} team={team} isAdmin={admin} />
    </>
  );
}
