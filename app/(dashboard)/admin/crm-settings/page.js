import { notFound } from "next/navigation";
import { getAuthSession } from "@/lib/auth-server";
import { canManageUsers } from "@/lib/permissions";
import { getCrmSettings } from "@/lib/crm-settings";
import CrmSettingsForm from "@/components/CrmSettingsForm";

export default async function AdminCrmSettingsPage() {
  const session = await getAuthSession();
  if (!canManageUsers(session)) notFound();

  const settings = await getCrmSettings();

  return (
    <>
      <h1 className="page-title">Ajustes comercial</h1>
      <p className="page-lead">
        Ajusta recordatorios por inactividad y reglas de puntuación de leads.
      </p>
      <CrmSettingsForm initial={settings} />
    </>
  );
}
