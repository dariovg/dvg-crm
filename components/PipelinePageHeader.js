"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function PipelinePageHeader({ staff }) {
  const { t } = useLocale();

  return (
    <>
      <h1 className="page-title">{t("page.pipeline.title")}</h1>
      <p className="page-lead">
        {t("page.pipeline.subtitle")}
        {!staff && t("page.pipeline.subtitleMine")}
      </p>
    </>
  );
}
