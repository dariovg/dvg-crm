import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-server";
import { canAccessFinance } from "@/lib/permissions";
import FinanceModule from "@/components/FinanceModule";
import {
  aggregateFinanceEntries,
  filterEntriesByMonth,
  currentYearMonth,
} from "@/lib/finance-stats";

export const dynamic = "force-dynamic";

export default async function FinanzasPage({ searchParams }) {
  const session = await getAuthSession();
  if (!canAccessFinance(session)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const filterMonth = params?.month || "";

  const [categories, allEntries] = await Promise.all([
    prisma.financeCategory.findMany({ orderBy: [{ type: "asc" }, { sortOrder: "asc" }] }),
    prisma.financeEntry.findMany({
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
      include: {
        category: true,
        quote: { select: { id: true, number: true } },
        contact: { select: { id: true, name: true } },
      },
    }),
  ]);

  const stats = aggregateFinanceEntries(allEntries);
  const entries = filterEntriesByMonth(allEntries, filterMonth);
  const monthOptions = [...new Set(stats.monthly.map((m) => m.key))].reverse();
  if (!monthOptions.includes(currentYearMonth())) {
    monthOptions.unshift(currentYearMonth());
  }

  return (
    <div className="page-pad">
      <header className="page-head">
        <div>
          <p className="breadcrumb">
            <Link href="/ceo">Panel CEO</Link> · Finanzas
          </p>
          <h1>Finanzas</h1>
          <p className="page-sub">
            Control manual de ingresos y gastos (EUR, IVA 21% incluido en importes de presupuestos).
          </p>
        </div>
      </header>

      <Suspense fallback={<p className="muted">Cargando…</p>}>
        <FinanceModule
          categories={categories}
          entries={entries}
          stats={stats}
          filterMonth={filterMonth}
          monthOptions={monthOptions}
        />
      </Suspense>
    </div>
  );
}
