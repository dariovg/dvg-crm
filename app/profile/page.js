import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-server";
import ProfileForm from "@/components/ProfileForm";
import { isProfileBlobConfigured } from "@/lib/profile-storage";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId || userId === "env-admin") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      profileStatus: true,
      statusMessage: true,
      role: true,
    },
  });
  if (!user) redirect("/login");

  return (
    <>
      <h1 className="page-title">Perfil</h1>
      <p className="page-lead">
        Tu foto y estado los ve el equipo en Equipo.
      </p>
      <ProfileForm user={user} blobConfigured={isProfileBlobConfigured()} />
    </>
  );
}
