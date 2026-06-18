import {
  annualMonthlyPrice,
  planById,
  packLineDescription,
} from "./pricing-catalog";

export { packLineDescription };

export function catalogPriceForPack(packId, billing) {
  const plan = planById(packId);
  if (!plan) return null;
  if (billing === "ANNUAL") return annualMonthlyPrice(plan.monthly);
  return plan.monthly;
}

export function computeLineTotal(line) {
  const qty = line.quantity || 1;
  const base = qty * line.unitPrice;
  if (line.discountPercent && line.discountPercent > 0) {
    return Math.round(base * (1 - line.discountPercent / 100));
  }
  return base;
}

export function computeQuoteSubtotal(lines) {
  return lines.reduce((sum, line) => sum + computeLineTotal(line), 0);
}

export function computeQuoteTotal(quote, lines) {
  const subtotal = computeQuoteSubtotal(lines);
  if (quote.discountPercent && quote.discountPercent > 0) {
    return Math.round(subtotal * (1 - quote.discountPercent / 100));
  }
  return subtotal;
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
  ANNUAL: "Facturación anual (15% dto.)",
};

export const FOOTER_TEXT = `Este presupuesto tiene una validez de 30 días desde la fecha de emisión.
Los importes indicados no incluyen IVA (21%).
Forma de pago: domiciliación bancaria o transferencia según acuerdo comercial.
El servicio incluye configuración inicial, soporte y mejoras continuas según el plan contratado.
Para cualquier consulta: info@dvgsstudio.com · www.dvgsstudio.com`;
