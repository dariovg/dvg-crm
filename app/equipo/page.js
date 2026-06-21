import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-server";
import TeamDirectory from "@/components/TeamDirectory";

export const dynamic = "force-dynamic";

export default async function EquipoPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect("/login");

  const users = await prisma.user.findMany({
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      profileStatus: true,
      statusMessage: true,
    },
  });

  return (
    <>
      <h1 className="page-title">Equipo</h1>
      <p className="page-lead">
        Fotos y estados del equipo. Si alguien está de vacaciones, lo verás aquí.
      </p>
      <TeamDirectory users={users} currentUserId={session.user.id} />
    </>
  );
}
