import { Suspense } from "react";
import { fetchScopedContacts } from "@/app/actions";
import { getAuthSession, listTeamUsers } from "@/lib/auth-server";
import { canAssignContacts, canDeleteContact, isStaff } from "@/lib/permissions";
import NewLeadForm from "@/components/NewLeadForm";
import LeadsFilters, { LeadsTable } from "@/components/LeadsTable";

export default async function LeadsPage({ searchParams }) {
  const params = await searchParams;
  const session = await getAuthSession();
  const staff = isStaff(session);
  const canAssign = canAssignContacts(session);
  const canDelete = canDeleteContact(session);
  const team = canAssign ? await listTeamUsers() : [];

  const contacts = await fetchScopedContacts({
    status: params.status || undefined,
    source: params.source || undefined,
    assigneeId: params.assignee || undefined,
    q: params.q || undefined,
  });

  return (
    <>
      <div className="page-head-row">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-lead">
            {contacts.length} contacto{contacts.length !== 1 ? "s" : ""}
            {staff ? " · Vista global" : " · Asignados a ti"}
          </p>
        </div>
        <NewLeadForm team={team} canAssign={canAssign} />
      </div>

      <Suspense fallback={<div className="filters-bar">Cargando filtros…</div>}>
        <LeadsFilters team={team} canAssign={canAssign} />
      </Suspense>

      <LeadsTable
        contacts={contacts}
        team={team}
        canAssign={canAssign}
        canDelete={canDelete}
      />
    </>
  );
}
