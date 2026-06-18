import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import { SOURCE_LABEL } from "@/lib/constants";

export default async function LeadsPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
    include: { meetings: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return (
    <>
      <h1 className="page-title">Leads</h1>
      <p className="page-lead">{contacts.length} contactos en el CRM.</p>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Empresa</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Origen</th>
              <th>Interés</th>
              <th>Creado</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/leads/${c.id}`}>{c.name}</Link>
                </td>
                <td>{c.email}</td>
                <td>{c.company || "—"}</td>
                <td>{c.phone || "—"}</td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
                <td>{SOURCE_LABEL[c.source] || c.source}</td>
                <td>{c.interest || "—"}</td>
                <td>{c.createdAt.toLocaleDateString("es-ES")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
