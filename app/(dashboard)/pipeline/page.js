import { prisma } from "@/lib/prisma";
import { CONTACT_STATUSES } from "@/lib/constants";
import { getAuthSession } from "@/lib/auth-server";
import { contactScope, isStaff } from "@/lib/permissions";
import { getScoringRules } from "@/lib/crm-settings";
import { withLeadScores } from "@/lib/lead-score";
import PipelineBoard from "@/components/PipelineBoard";

export default async function PipelinePage() {
  const session = await getAuthSession();
  const scope = contactScope(session);
  const scoringRules = await getScoringRules();

  const rawContacts = await prisma.contact.findMany({
    where: scope,
    orderBy: { updatedAt: "desc" },
    include: {
      assignee: { select: { id: true, email: true, name: true, role: true } },
    },
  });
  const contacts = withLeadScores(rawContacts, scoringRules);

  const columns = CONTACT_STATUSES.filter((s) => s.id !== "LOST").map((s) => ({
    ...s,
    contacts: contacts.filter((c) => c.status === s.id),
  }));

  const lost = contacts.filter((c) => c.status === "LOST");

  return (
    <>
      <h1 className="page-title">Pipeline</h1>
      <p className="page-lead">
        Arrastra tarjetas entre columnas o pulsa para ver detalle.
        {isStaff(session) ? "" : " Solo tus leads asignados."}
      </p>
      <PipelineBoard
        columns={columns}
        lostContacts={lost}
        allStatuses={CONTACT_STATUSES}
        isStaff={isStaff(session)}
      />
    </>
  );
}
