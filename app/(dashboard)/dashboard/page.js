import { prisma } from "@/lib/prisma";
import { CONTACT_STATUSES } from "@/lib/constants";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export default async function DashboardPage() {
  const [total, byStatus, recent] = await Promise.all([
    prisma.contact.count(),
    prisma.contact.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const counts = Object.fromEntries(byStatus.map((b) => [b.status, b._count._all]));

  return (
    <>
      <h1 className="page-title">Resumen</h1>
      <p className="page-lead">Vista general de leads y pipeline DVG Studio.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <strong>{total}</strong>
          <span>Total contactos</span>
        </div>
        <div className="stat-card">
          <strong>{counts.NEW || 0}</strong>
          <span>Nuevos</span>
        </div>
        <div className="stat-card">
          <strong>{counts.MEETING_SCHEDULED || 0}</strong>
          <span>Reuniones agendadas</span>
        </div>
        <div className="stat-card">
          <strong>{counts.WON || 0}</strong>
          <span>Clientes</span>
        </div>
      </div>

      <div className="card">
        <h2>Pipeline</h2>
        <div className="stats-grid">
          {CONTACT_STATUSES.map((s) => (
            <div key={s.id} className="stat-card">
              <strong>{counts[s.id] || 0}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/leads/${c.id}`}>{c.name}</Link>
                </td>
                <td>{c.email}</td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
                <td>{c.createdAt.toLocaleDateString("es-ES")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
