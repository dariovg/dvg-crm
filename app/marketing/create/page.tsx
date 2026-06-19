// app/marketing/create/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { canAccessMarketing } from "@/lib/permissions";
import { PublishForm } from "@/components/marketing/PublishForm";

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
            Redacta un post para redes. Quedará pendiente de aprobación antes de publicarse.
          </p>
        </div>
      </header>

      <div className="marketing-create-grid">
        <PublishForm />
        <aside className="panel marketing-tips">
          <h2 className="panel-title">Consejos</h2>
          <ul className="marketing-tips-list">
            <li>
              <strong>Límites:</strong> X 280 · TikTok 150 · Instagram 2.200 caracteres
            </li>
            <li>
              <strong>Horario:</strong> entre semana 9–11 h suele rendir mejor
            </li>
            <li>
              <strong>Hashtags:</strong> 3–5 relevantes por plataforma
            </li>
            <li>
              <strong>Visual:</strong> las imágenes multiplican el engagement
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
