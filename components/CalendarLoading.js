"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function CalendarLoading() {
  const { t } = useLocale();
  return <p>{t("page.calendar.loading")}</p>;
}
