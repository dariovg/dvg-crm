import { Suspense } from "react";
import { fetchScopedContacts } from "@/app/actions";
import { getAuthSession, listTeamUsers } from "@/lib/auth-server";
import { canAssignContacts, canDeleteContact, isStaff } from "@/lib/permissions";
import NewLeadForm from "@/components/NewLeadForm";
import LeadsPageHeader from "@/components/LeadsPageHeader";
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
        <LeadsPageHeader count={contacts.length} staff={staff} />
        <NewLeadForm team={team} canAssign={canAssign} />
      </div>

      <Suspense fallback={null}>
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
