import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { canAccessMarketing } from "@/lib/permissions";
import CreateContentClient from "@/components/marketing/CreateContentClient";

export default async function CreatePostPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (!canAccessMarketing(session)) redirect("/dashboard");

  return (
    <div className="page-pad">
      <header className="page-head">
        <div>
          <h1>Crear contenido</h1>
          <p className="page-sub">
            Tu post diario — revisión → aprobación → publicación en X
          </p>
        </div>
      </header>
      <CreateContentClient />
    </div>
  );
}
