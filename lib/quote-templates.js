/** Plantillas de presupuesto por tipo de proyecto. */
export const QUOTE_PROJECT_TYPES = ["WEB", "IA", "CONSULTING"];

export const QUOTE_PROJECT_LABEL = {
  WEB: "Web / App",
  IA: "Agente IA",
  CONSULTING: "Consultoría",
};

export const QUOTE_TEMPLATES = {
  WEB: {
    id: "WEB",
    label: "Web / App",
    description: "Desarrollo web, landing o aplicación a medida",
    defaultPackId: null,
    defaultBilling: "MONTHLY",
    notes:
      "Alcance web: diseño responsive, CMS o panel admin, despliegue y formación básica. Revisiones incluidas según líneas.",
    customLines: [
      {
        description:
          "Proyecto web a medida\n• Diseño UX/UI responsive\n• Desarrollo frontend + backend\n• Despliegue, SSL y formación",
        quantity: 1,
        unitPrice: 3500,
      },
      {
        description: "Mantenimiento y soporte mensual (opcional)",
        quantity: 1,
        unitPrice: 149,
      },
    ],
  },
  IA: {
    id: "IA",
    label: "Agente IA",
    description: "Automatización con agentes IA en canales del cliente",
    defaultPackId: "pro",
    defaultBilling: "MONTHLY",
    notes:
      "Incluye auditoría inicial, configuración de canales y mejoras continuas según plan contratado.",
    customLines: [],
  },
  CONSULTING: {
    id: "CONSULTING",
    label: "Consultoría",
    description: "Diagnóstico, estrategia digital e implementación puntual",
    defaultPackId: null,
    defaultBilling: "MONTHLY",
    notes: "Sesiones facturables por bloques. Informe ejecutivo incluido al cierre del paquete.",
    customLines: [
      {
        description:
          "Consultoría estratégica\n• Auditoría procesos y herramientas\n• Roadmap de automatización\n• Sesiones con stakeholders",
        quantity: 1,
        unitPrice: 1200,
      },
      {
        description: "Sesión adicional (2 h)",
        quantity: 1,
        unitPrice: 350,
      },
    ],
  },
};

export function templateById(id) {
  return QUOTE_TEMPLATES[id] || null;
}

/** Líneas iniciales según plantilla (pack + custom). */
export function buildLinesFromTemplate(templateId, billing, catalogPriceForPack, packLineDescription) {
  const tpl = templateById(templateId);
  if (!tpl) return { packId: null, billing, lines: [] };

  const lines = [];
  let packId = tpl.defaultPackId || null;
  const resolvedBilling = tpl.defaultBilling || billing;

  if (packId) {
    lines.push({
      type: "PACK",
      packId,
      description: packLineDescription(packId),
      quantity: 1,
      unitPrice: catalogPriceForPack(packId, resolvedBilling),
      sortOrder: 0,
    });
  }

  tpl.customLines.forEach((line, i) => {
    lines.push({
      type: "CUSTOM",
      description: line.description,
      quantity: line.quantity ?? 1,
      unitPrice: line.unitPrice ?? 0,
      discountPercent: null,
      sortOrder: lines.length + i,
    });
  });

  return {
    packId,
    billing: resolvedBilling,
    notes: tpl.notes,
    lines,
  };
}
