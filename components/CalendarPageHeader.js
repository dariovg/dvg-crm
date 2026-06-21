"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function CalendarPageHeader() {
  const { t } = useLocale();

  return (
    <>
      <h1 className="page-title">{t("page.calendar.title")}</h1>
      <p className="page-lead">{t("page.calendar.subtitle")}</p>
    </>
  );
}
