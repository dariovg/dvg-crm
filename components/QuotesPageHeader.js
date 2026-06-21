"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

export default function QuotesPageHeader({
  count,
  staff,
  admin,
  pendingCount,
  statusFilter,
}) {
  const { t } = useLocale();
  const subtitleKey = staff ? "page.quotes.subtitleGlobal" : "page.quotes.subtitleMine";

  return (
    <>
      <h1 className="page-title">{t("page.quotes.title")}</h1>
      <p className="page-lead">
        {t(subtitleKey, { count })}
        {admin && pendingCount > 0 && (
          <>
            {" · "}
            <strong>{t("page.quotes.pendingApproval", { count: pendingCount })}</strong>
          </>
        )}
      </p>

      <div className="quote-filters">
        <Link
          href="/presupuestos"
          prefetch={false}
          className={`filter-chip${!statusFilter ? " filter-chip--active" : ""}`}
        >
          {t("page.quotes.filterAll")}
        </Link>
        <Link
          href="/presupuestos?status=DRAFT"
          prefetch={false}
          className={`filter-chip${statusFilter === "DRAFT" ? " filter-chip--active" : ""}`}
        >
          {t("page.quotes.filterDraft")}
        </Link>
        {admin && (
          <Link
            href="/presupuestos?status=PENDING_APPROVAL"
            prefetch={false}
            className={`filter-chip${statusFilter === "PENDING_APPROVAL" ? " filter-chip--active" : ""}`}
          >
            {t("page.quotes.filterPending", { count: pendingCount })}
          </Link>
        )}
        <Link
          href="/presupuestos?status=SENT"
          prefetch={false}
          className={`filter-chip${statusFilter === "SENT" ? " filter-chip--active" : ""}`}
        >
          {t("page.quotes.filterSent")}
        </Link>
        <Link
          href="/presupuestos?status=ACCEPTED"
          prefetch={false}
          className={`filter-chip${statusFilter === "ACCEPTED" ? " filter-chip--active" : ""}`}
        >
          {t("page.quotes.filterAccepted")}
        </Link>
      </div>
    </>
  );
}
