/**
 * Agregaciones de finanzas (importes en céntimos EUR).
 */

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
}

export function aggregateFinanceEntries(entries) {
  let totalIncome = 0;
  let totalExpense = 0;
  const byMonth = new Map();

  for (const entry of entries) {
    const key = monthKey(entry.entryDate);
    if (!byMonth.has(key)) {
      byMonth.set(key, { income: 0, expense: 0 });
    }
    const bucket = byMonth.get(key);
    if (entry.type === "INCOME") {
      totalIncome += entry.amount;
      bucket.income += entry.amount;
    } else {
      totalExpense += entry.amount;
      bucket.expense += entry.amount;
    }
  }

  const monthly = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => ({
      key,
      label: monthLabel(key),
      income: vals.income,
      expense: vals.expense,
      net: vals.income - vals.expense,
    }));

  const maxBar = Math.max(
    1,
    ...monthly.flatMap((m) => [m.income, m.expense, Math.abs(m.net)])
  );

  return {
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    monthly,
    maxBar,
  };
}

export function filterEntriesByMonth(entries, yearMonth) {
  if (!yearMonth) return entries;
  return entries.filter((e) => monthKey(e.entryDate) === yearMonth);
}

export function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function parseEuroToCents(value) {
  const normalized = String(value).trim().replace(",", ".");
  if (!normalized) throw new Error("Importe obligatorio");
  const num = Number(normalized);
  if (!Number.isFinite(num) || num < 0) throw new Error("Importe no válido");
  return Math.round(num * 100);
}
