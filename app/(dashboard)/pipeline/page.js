import { prisma } from "@/lib/prisma";
import { CONTACT_STATUSES } from "@/lib/constants";
import PipelineBoard from "@/components/PipelineBoard";

export default async function PipelinePage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const columns = CONTACT_STATUSES.filter((s) => s.id !== "LOST").map((s) => ({
    ...s,
    contacts: contacts.filter((c) => c.status === s.id),
  }));

  const lost = contacts.filter((c) => c.status === "LOST");

  return (
    <>
      <h1 className="page-title">Pipeline</h1>
      <p className="page-lead">Arrastra estados con el selector de cada tarjeta.</p>
      <PipelineBoard columns={columns} />
      {lost.length > 0 && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <h2>Perdidos ({lost.length})</h2>
          <PipelineBoard
            columns={[{ id: "LOST", label: "Perdido", contacts: lost }]}
          />
        </div>
      )}
    </>
  );
}
