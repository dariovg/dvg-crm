import { computeQuoteTotalWithVat } from "./quotes.js";

const INCOME_CATEGORY_BY_PROJECT = {
  IA: "clientes-ia",
  WEB: "implementacion",
  CONSULTING: "implementacion",
};

/** Sugiere un ingreso a partir de un presupuesto aceptado. */
export function buildIncomeFromQuote(quote, lines, { entryDate = new Date() } = {}) {
  const monthlyWithVat = computeQuoteTotalWithVat(quote, lines);
  const categorySlug =
    INCOME_CATEGORY_BY_PROJECT[quote.projectType] || "clientes-ia";
  const baseDescription = `Presupuesto ${quote.number} · ${quote.contact?.name || "Cliente"}`;

  if (quote.billing === "ANNUAL") {
    return {
      type: "INCOME",
      amount: monthlyWithVat * 12,
      entryDate,
      recurring: false,
      description: `${baseDescription} (pago anual, 12 meses)`,
      categorySlug,
      quoteId: quote.id,
      contactId: quote.contactId,
    };
  }

  return {
    type: "INCOME",
    amount: monthlyWithVat,
    entryDate,
    recurring: true,
    description: `${baseDescription} (facturación mensual)`,
    categorySlug,
    quoteId: quote.id,
    contactId: quote.contactId,
  };
}
