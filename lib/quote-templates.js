/** Plantillas de presupuesto por tipo de proyecto. */
import { buildIaPackLineFields } from "./pricing-catalog.js";

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
  const resolvedBilling = billing ?? tpl.defaultBilling ?? "MONTHLY";

  if (packId) {
    const iaPromo = templateId === "IA" ? buildIaPackLineFields(packId, resolvedBilling) : null;
    lines.push({
      type: "PACK",
      packId,
      description: iaPromo?.description ?? packLineDescription(packId, resolvedBilling),
      quantity: 1,
      unitPrice: catalogPriceForPack(packId, resolvedBilling),
      discountPercent: iaPromo?.discountPercent ?? null,
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

/** Comprueba si las líneas de una plantilla ya están en el presupuesto. */
export function isTemplateInLines(templateId, lines = []) {
  const tpl = templateById(templateId);
  if (!tpl) return false;

  const hasPack = tpl.defaultPackId
    ? lines.some((l) => l.type === "PACK" && l.packId === tpl.defaultPackId)
    : true;

  const hasCustom =
    tpl.customLines.length === 0
      ? true
      : tpl.customLines.every((cl) =>
          lines.some(
            (l) =>
              l.type === "CUSTOM" &&
              l.description?.trim() === cl.description.trim()
          )
        );

  if (tpl.defaultPackId && tpl.customLines.length) return hasPack && hasCustom;
  if (tpl.defaultPackId) return hasPack;
  if (tpl.customLines.length) return hasCustom;
  return false;
}

/** Añade solo las líneas de plantilla que aún no existen. */
export function appendTemplateLines(
  templateId,
  billing,
  existingLines = [],
  catalogPriceForPack,
  packLineDescription
) {
  const tpl = templateById(templateId);
  if (!tpl) return [];

  const toAdd = [];
  const baseOrder = existingLines.length;

  if (tpl.defaultPackId) {
    const exists = existingLines.some(
      (l) => l.type === "PACK" && l.packId === tpl.defaultPackId
    );
    if (!exists) {
      const iaPromo = tpl.id === "IA" ? buildIaPackLineFields(tpl.defaultPackId, billing) : null;
      toAdd.push({
        type: "PACK",
        packId: tpl.defaultPackId,
        description: iaPromo?.description ?? packLineDescription(tpl.defaultPackId, billing),
        quantity: 1,
        unitPrice: catalogPriceForPack(tpl.defaultPackId, billing),
        discountPercent: iaPromo?.discountPercent ?? null,
        sortOrder: baseOrder + toAdd.length,
      });
    }
  }

  tpl.customLines.forEach((line) => {
    const desc = line.description.trim();
    const exists = existingLines.some(
      (l) => l.type === "CUSTOM" && l.description?.trim() === desc
    );
    if (!exists) {
      toAdd.push({
        type: "CUSTOM",
        description: line.description,
        quantity: line.quantity ?? 1,
        unitPrice: line.unitPrice ?? 0,
        discountPercent: null,
        sortOrder: baseOrder + toAdd.length,
      });
    }
  });

  return toAdd;
}

/** Quita las líneas asociadas a una plantilla sin tocar el resto. */
export function removeTemplateFromLines(templateId, lines = []) {
  const tpl = templateById(templateId);
  if (!tpl) return lines;

  const customDescs = new Set(tpl.customLines.map((l) => l.description.trim()));
  const packIds = new Set(tpl.defaultPackId ? [tpl.defaultPackId] : []);

  return lines
    .filter((l) => {
      if (l.type === "PACK" && packIds.has(l.packId)) return false;
      if (l.type === "CUSTOM" && customDescs.has(l.description?.trim())) return false;
      return true;
    })
    .map((l, i) => ({ ...l, sortOrder: i }));
}

/** Etiqueta legible cuando hay varios servicios en el mismo presupuesto. */
export function resolveQuoteProjectLabel(lines = [], fallback = "IA") {
  const active = QUOTE_PROJECT_TYPES.filter((t) => isTemplateInLines(t, lines));
  if (!active.length) return QUOTE_PROJECT_LABEL[fallback] || fallback;
  if (active.length === 1) return QUOTE_PROJECT_LABEL[active[0]];
  return active.map((t) => QUOTE_PROJECT_LABEL[t]).join(" + ");
}

export function inferProjectTypeFromLines(lines = [], fallback = "IA") {
  if (lines.some((l) => l.type === "PACK") || isTemplateInLines("IA", lines)) {
    return "IA";
  }
  if (isTemplateInLines("WEB", lines)) return "WEB";
  if (isTemplateInLines("CONSULTING", lines)) return "CONSULTING";
  return fallback;
}
