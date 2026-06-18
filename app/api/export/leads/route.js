import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { STATUS_LABEL, SOURCE_LABEL } from "@/lib/constants";
import { isAdmin } from "@/lib/permissions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Solo administración" }, { status: 403 });
  }

  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      meetings: { orderBy: { createdAt: "desc" }, take: 1 },
      assignee: { select: { email: true, name: true } },
    },
  });

  const header = [
    "id",
    "nombre",
    "email",
    "empresa",
    "telefono",
    "estado",
    "origen",
    "interes",
    "asignado_a",
    "creado",
    "proxima_cita",
  ];

  const rows = contacts.map((c) => [
    c.id,
    c.name,
    c.email,
    c.company || "",
    c.phone || "",
    STATUS_LABEL[c.status] || c.status,
    SOURCE_LABEL[c.source] || c.source,
    c.interest || "",
    c.assignee ? c.assignee.name || c.assignee.email : "",
    c.createdAt.toISOString(),
    c.meetings[0] ? `${c.meetings[0].date} ${c.meetings[0].time}` : "",
  ]);

  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dvg-leads.csv"',
    },
  });
}
