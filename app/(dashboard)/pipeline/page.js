import { prisma } from "@/lib/prisma";
import { CONTACT_STATUSES } from "@/lib/constants";
import { getAuthSession } from "@/lib/auth-server";
import { contactScope, isStaff } from "@/lib/permissions";
import PipelineBoard from "@/components/PipelineBoard";

export default async function PipelinePage() {
  const session = await getAuthSession();
  const scope = contactScope(session);

  const contacts = await prisma.contact.findMany({
    where: scope,
    orderBy: { updatedAt: "desc" },
    include: {
      assignee: { select: { id: true, email: true, name: true, role: true } },
    },
  });

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
      <div className="pipeline-scroll">
      <PipelineBoard
        columns={columns}
        allStatuses={CONTACT_STATUSES}
        isAdmin={isStaff(session)}
      />
      </div>
      {lost.length > 0 && (
        <div className="card pipeline-lost">
          <h2>Perdidos ({lost.length})</h2>
          <PipelineBoard
            columns={[{ id: "LOST", label: "Perdido", contacts: lost }]}
            allStatuses={CONTACT_STATUSES}
            isAdmin={isStaff(session)}
          />
        </div>
      )}
    </>
  );
}
