/** Precios de packs — copiados del sitio web (fuente única dentro del CRM). */
export const ANNUAL_DISCOUNT_PERCENT = 15;
/** Promo confianza mutua: −40% mantenimiento mes 1 (solo packs IA). */
export const FIRST_MONTH_IA_DISCOUNT_PERCENT = 40;
/** Meses normales por defecto al añadir plantilla IA (mín. 3 meses = 1 promo + 2 normales). */
export const IA_TEMPLATE_DEFAULT_REGULAR_MONTHS = 2;

export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthly: 349,
    badge: null,
    note: "Para liberar tiempo en tu tarea más pesada",
    agents: "1 agente IA",
    highlights: [
      "Todos los canales (WA, TG, email, web…)",
      "Auditoría gratuita",
      "Soporte 24/7 y mejoras",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 949,
    badge: "★ El más elegido",
    note: "Para automatizar el trabajo de un departamento entero",
    agents: "Hasta 5 agentes IA",
    highlights: [
      "Todos los canales",
      "Integración CRM/herramientas",
      "Mejoras web con IA",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthly: 1749,
    badge: null,
    note: "Para conectar todo tu negocio a medida",
    agents: "Hasta 10 agentes IA",
    highlights: [
      "Todos los canales",
      "Integración CRM/ERP",
      "Account manager + SLA",
    ],
  },
];

export function packUnitPrice(packId, billing = "MONTHLY") {
  const plan = planById(packId);
  if (!plan) return 0;
  if (billing === "ANNUAL") return annualMonthlyPrice(plan.monthly);
  return plan.monthly;
}

export function annualMonthlyPrice(monthly) {
  return Math.round(monthly * (1 - ANNUAL_DISCOUNT_PERCENT / 100));
}

export function firstMonthIaPrice(monthlyOrRate) {
  return Math.round(monthlyOrRate * (1 - FIRST_MONTH_IA_DISCOUNT_PERCENT / 100));
}

/** Total pago único anual IA: mes 1 (−15% y −40%) + 11 meses (−15%). */
export function annualUpfrontIaTotal(monthlyListPrice) {
  const rate = annualMonthlyPrice(monthlyListPrice);
  return firstMonthIaPrice(rate) + rate * 11;
}

export function iaPackFirstMonthDiscountPercent() {
  return FIRST_MONTH_IA_DISCOUNT_PERCENT;
}

export function isIaFirstMonthLine(line) {
  return (
    line?.type === "PACK" &&
    line.packId &&
    line.discountPercent === FIRST_MONTH_IA_DISCOUNT_PERCENT
  );
}

export function isIaRegularMonthLine(line) {
  return line?.type === "PACK" && line.packId && !isIaFirstMonthLine(line);
}

export function annualSavingsPerYear(monthly) {
  return (monthly - annualMonthlyPrice(monthly)) * 12;
}

export function formatEuro(amount) {
  return `€${Number(amount).toLocaleString("es-ES")}`;
}

export function planById(id) {
  return PLANS.find((p) => p.id === id);
}

export function iaFirstMonthLineDescription(packId, billing = "MONTHLY") {
  const plan = planById(packId);
  if (!plan) return "Mes 1 — mantenimiento agente IA";
  const rateLabel =
    billing === "ANNUAL"
      ? `tarifa anual −${ANNUAL_DISCOUNT_PERCENT}%`
      : "tarifa mensual";
  return [
    `Mes 1 — ${plan.name} (${plan.agents})`,
    `Mantenimiento agente IA · promo confianza mutua −${FIRST_MONTH_IA_DISCOUNT_PERCENT}%`,
    `${rateLabel} · ${plan.note}`,
  ].join("\n");
}

export function iaRegularMonthLineDescription(packId, billing = "MONTHLY") {
  const plan = planById(packId);
  if (!plan) return "Mes mantenimiento agente IA";
  const rateLabel =
    billing === "ANNUAL"
      ? `Tarifa mensual anual (−${ANNUAL_DISCOUNT_PERCENT}%)`
      : "Tarifa mensual de catálogo";
  return [
    `Mes mantenimiento — ${plan.name} (${plan.agents})`,
    `${rateLabel} · ${plan.note}`,
    plan.highlights.map((h) => `• ${h}`).join("\n"),
  ].join("\n");
}

/** @deprecated Usar iaFirstMonthLineDescription / buildIaFirstMonthLine */
export function packLineDescription(packId, billing = "MONTHLY") {
  return iaRegularMonthLineDescription(packId, billing);
}

export function buildIaFirstMonthLine(packId, billing = "MONTHLY", sortOrder = 0) {
  return {
    type: "PACK",
    packId,
    description: iaFirstMonthLineDescription(packId, billing),
    quantity: 1,
    unitPrice: packUnitPrice(packId, billing),
    discountPercent: FIRST_MONTH_IA_DISCOUNT_PERCENT,
    sortOrder,
  };
}

export function buildIaRegularMonthLine(
  packId,
  billing = "MONTHLY",
  quantity = 1,
  sortOrder = 0
) {
  return {
    type: "PACK",
    packId,
    description: iaRegularMonthLineDescription(packId, billing),
    quantity,
    unitPrice: packUnitPrice(packId, billing),
    discountPercent: null,
    sortOrder,
  };
}

/** Líneas IA por defecto: 1 mes promo + N meses normales. */
export function buildDefaultIaPackLines(
  packId,
  billing = "MONTHLY",
  regularMonths = IA_TEMPLATE_DEFAULT_REGULAR_MONTHS
) {
  return [
    buildIaFirstMonthLine(packId, billing, 0),
    buildIaRegularMonthLine(packId, billing, regularMonths, 1),
  ];
}

/** @deprecated Usar buildIaFirstMonthLine / buildIaRegularMonthLine */
export function buildIaPackLineFields(packId, billing) {
  return {
    description: iaFirstMonthLineDescription(packId, billing),
    discountPercent: FIRST_MONTH_IA_DISCOUNT_PERCENT,
  };
}
