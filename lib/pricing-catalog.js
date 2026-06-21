/** Precios de packs — copiados del sitio web (fuente única dentro del CRM). */
export const ANNUAL_DISCOUNT_PERCENT = 15;
/** Promo confianza mutua: −40% mantenimiento mes 1 (solo packs IA). */
export const FIRST_MONTH_IA_DISCOUNT_PERCENT = 40;

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

/** Descuento primer mes en líneas PACK IA (mensual y anual). */
export function iaPackFirstMonthDiscountPercent(billing) {
  if (billing === "MONTHLY" || billing === "ANNUAL") {
    return FIRST_MONTH_IA_DISCOUNT_PERCENT;
  }
  return null;
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

export function packLineDescription(packId, billing = "MONTHLY") {
  const plan = planById(packId);
  if (!plan) return "";
  const highlights = plan.highlights.map((h) => `• ${h}`).join("\n");
  let desc = `Plan ${plan.name} — ${plan.agents}\n${plan.note}\n${highlights}`;
  const firstMonthDto = iaPackFirstMonthDiscountPercent(billing);
  if (firstMonthDto && billing === "MONTHLY") {
    desc += `\n\nPromo confianza mutua (nuevos clientes IA): −${firstMonthDto}% mantenimiento mes 1. Meses 2+ al precio de catálogo. Mín. 3 meses.`;
  } else if (firstMonthDto && billing === "ANNUAL") {
    desc += `\n\nPromo confianza mutua (nuevos clientes IA): facturación anual en pago único — 11 meses a tarifa −${ANNUAL_DISCOUNT_PERCENT}%, mes 1 con −${firstMonthDto}% adicional sobre esa tarifa.`;
  }
  return desc;
}

export function buildIaPackLineFields(packId, billing) {
  return {
    description: packLineDescription(packId, billing),
    discountPercent: iaPackFirstMonthDiscountPercent(billing),
  };
}
