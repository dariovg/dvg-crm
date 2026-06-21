import {
  annualMonthlyPrice,
  planById,
  packLineDescription,
  buildIaPackLineFields,
  firstMonthIaPrice,
  FIRST_MONTH_IA_DISCOUNT_PERCENT,
} from "./pricing-catalog.js";

export { packLineDescription, buildIaPackLineFields, FIRST_MONTH_IA_DISCOUNT_PERCENT };

export function catalogPriceForPack(packId, billing) {
  const plan = planById(packId);
  if (!plan) return null;
  if (billing === "ANNUAL") return annualMonthlyPrice(plan.monthly);
  return plan.monthly;
}

export function isIaFirstMonthPromoLine(line) {
  return (
    line.type === "PACK" &&
    line.packId &&
    line.discountPercent === FIRST_MONTH_IA_DISCOUNT_PERCENT
  );
}

export function formatLineDiscountLabel(line, billing) {
  if (isIaFirstMonthPromoLine(line)) {
    if (billing === "ANNUAL") {
      return `Mes 1 −${line.discountPercent}% (tarifa anual)`;
    }
    return `Mes 1 −${line.discountPercent}%`;
  }
  return line.discountPercent ? `${line.discountPercent}%` : "—";
}

export function hasIaFirstMonthPromo(lines) {
  return lines.some((l) => isIaFirstMonthPromoLine(l));
}

export const VAT_RATE = 0.21;

export function computeLineTotal(line, billing = "MONTHLY") {
  const qty = line.quantity || 1;

  if (isIaFirstMonthPromoLine(line)) {
    if (billing === "ANNUAL") {
      const rate = line.unitPrice;
      const firstMonth = firstMonthIaPrice(rate);
      return Math.round((firstMonth + rate * 11) * qty);
    }
    const base = qty * line.unitPrice;
    return Math.round(base * (1 - FIRST_MONTH_IA_DISCOUNT_PERCENT / 100));
  }

  if (billing === "ANNUAL" && line.type === "PACK" && line.packId) {
    return Math.round(line.unitPrice * 12 * qty);
  }

  const base = qty * line.unitPrice;
  if (line.discountPercent && line.discountPercent > 0) {
    return Math.round(base * (1 - line.discountPercent / 100));
  }
  return base;
}

export function computeLineVat(line, billing = "MONTHLY") {
  return Math.round(computeLineTotal(line, billing) * VAT_RATE);
}

export function computeQuoteSubtotal(lines, billing = "MONTHLY") {
  return lines.reduce((sum, line) => sum + computeLineTotal(line, billing), 0);
}

/** Base imponible tras descuento global (sin IVA). */
export function computeQuoteTotal(quote, lines) {
  const subtotal = computeQuoteSubtotal(lines, quote.billing);
  if (quote.discountPercent && quote.discountPercent > 0) {
    return Math.round(subtotal * (1 - quote.discountPercent / 100));
  }
  return subtotal;
}

export function computeQuoteVat(quote, lines) {
  const base = computeQuoteTotal(quote, lines);
  return Math.round(base * VAT_RATE);
}

export function computeQuoteTotalWithVat(quote, lines) {
  const base = computeQuoteTotal(quote, lines);
  return base + computeQuoteVat(quote, lines);
}

/** Requiere aprobación admin si algún pack mensual/anual está por debajo del catálogo. */
export function needsApproval(quote, lines) {
  for (const line of lines) {
    if (line.type !== "PACK" || !line.packId) continue;
    const catalog = catalogPriceForPack(line.packId, quote.billing);
    if (catalog != null && line.unitPrice < catalog) return true;
  }
  return false;
}

export async function generateQuoteNumber(prisma) {
  const year = new Date().getFullYear();
  const prefix = `PRE-${year}-`;
  const last = await prisma.quote.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  let seq = 1;
  if (last?.number) {
    const part = last.number.slice(prefix.length);
    seq = parseInt(part, 10) + 1;
  }
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

export const QUOTE_STATUS_LABEL = {
  DRAFT: "Borrador",
  PENDING_APPROVAL: "Pendiente aprobación",
  APPROVED: "Aprobado",
  SENT: "Enviado",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
};

export const QUOTE_BILLING_LABEL = {
  MONTHLY: "Facturación mensual",
  ANNUAL: "Facturación anual (pago único 12 meses · −15% + promo mes 1 IA)",
};

export const FOOTER_TEXT = `Este presupuesto tiene una validez de 30 días desde la fecha de emisión.
Los importes base son sin IVA; el IVA (21%) se desglosa por línea y en el total.
Forma de pago: domiciliación bancaria o transferencia según acuerdo comercial.
El servicio incluye configuración inicial, soporte y mejoras continuas según el plan contratado.
Para cualquier consulta: info@dvgsstudio.com · www.dvgsstudio.com`;
