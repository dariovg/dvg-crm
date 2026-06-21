"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function LeadsPageHeader({ count, staff }) {
  const { t } = useLocale();
  const subtitleKey = staff ? "page.leads.subtitleGlobal" : "page.leads.subtitleMine";

  return (
    <div>
      <h1 className="page-title">{t("page.leads.title")}</h1>
      <p className="page-lead">{t(subtitleKey, { count })}</p>
    </div>
  );
}
