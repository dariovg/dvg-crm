import { notFound } from "next/navigation";
import { getAuthSession } from "@/lib/auth-server";
import { isStaff } from "@/lib/permissions";
import ImportLeadsForm from "@/components/ImportLeadsForm";

export default async function ImportLeadsPage() {
  const session = await getAuthSession();
  if (!isStaff(session)) notFound();

  return (
    <>
      <h1 className="page-title">Importar leads</h1>
      <p className="page-lead">Pega un CSV exportado de Excel o Google Sheets.</p>
      <ImportLeadsForm />
    </>
  );
}
