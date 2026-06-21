import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-server";
import { canAccessHr } from "@/lib/permissions";
import HrModule from "@/components/HrModule";

export const dynamic = "force-dynamic";

export default async function RrhhPage() {
  const session = await getAuthSession();
  if (!canAccessHr(session)) {
    redirect("/dashboard");
  }

  const [employees, users] = await Promise.all([
    prisma.employeeProfile.findMany({
      orderBy: [{ active: "desc" }, { fullName: "asc" }],
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: { id: true, email: true, name: true, role: true },
    }),
  ]);

  return (
    <div className="page-pad">
      <header className="page-head">
        <div>
          <p className="breadcrumb">
            <Link href="/ceo">Panel CEO</Link> · RRHH
          </p>
          <h1>Recursos humanos</h1>
          <p className="page-sub">
            Fichas de empleado, contratos y coste mensual estimado.
          </p>
        </div>
      </header>

      <HrModule employees={employees} users={users} />
    </div>
  );
}
