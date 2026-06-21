"use client";

import { PLANS, formatEuro, packLineDescription, buildIaPackLineFields, firstMonthIaPrice, annualUpfrontIaTotal, FIRST_MONTH_IA_DISCOUNT_PERCENT } from "@/lib/pricing-catalog";
import { catalogPriceForPack } from "@/lib/quotes";
import {
  QUOTE_TEMPLATES,
  isTemplateInLines,
  appendTemplateLines,
  removeTemplateFromLines,
} from "@/lib/quote-templates";

export default function QuoteServicesPicker({
  lines,
  onChange,
  billing,
  onBillingChange,
  disabled = false,
}) {
  function syncPackPrices(nextBilling) {
    onChange(
      lines.map((line) => {
        if (line.type === "PACK" && line.packId) {
          const promo = buildIaPackLineFields(line.packId, nextBilling);
          return {
            ...line,
            unitPrice: catalogPriceForPack(line.packId, nextBilling),
            discountPercent: promo.discountPercent,
            description: promo.description,
          };
        }
        return line;
      })
    );
  }

  function handleBillingChange(next) {
    onBillingChange(next);
    syncPackPrices(next);
  }

  function toggleTemplate(type) {
    if (disabled) return;
    let nextLines;
    if (isTemplateInLines(type, lines)) {
      nextLines = removeTemplateFromLines(type, lines);
    } else {
      const added = appendTemplateLines(
        type,
        billing,
        lines,
        catalogPriceForPack,
        packLineDescription
      );
      nextLines = [...lines, ...added].map((l, i) => ({ ...l, sortOrder: i }));
    }
    onChange(nextLines);
  }

  function addPack(packId) {
    if (disabled || lines.some((l) => l.type === "PACK" && l.packId === packId)) return;
    const promo = buildIaPackLineFields(packId, billing);
    onChange([
      ...lines,
      {
        type: "PACK",
        packId,
        description: promo.description,
        quantity: 1,
        unitPrice: catalogPriceForPack(packId, billing),
        discountPercent: promo.discountPercent,
        sortOrder: lines.length,
      },
    ]);
  }

  function removePack(packId) {
    if (disabled) return;
    onChange(lines.filter((l) => !(l.type === "PACK" && l.packId === packId)));
  }

  return (
    <>
      <p className="muted quote-pack-hint" style={{ marginTop: 0 }}>
        Pulsa cada servicio para <strong>añadirlo o quitarlo</strong>. Puedes combinar{" "}
        <strong>Web / App + Agente IA Pro</strong> (u otros planes) en el mismo presupuesto.
      </p>
      <div className="quote-template-picker">
        {Object.values(QUOTE_TEMPLATES).map((tpl) => {
          const added = isTemplateInLines(tpl.id, lines);
          return (
            <button
              key={tpl.id}
              type="button"
              className={`quote-template-btn${added ? " quote-template-btn--active" : ""}`}
              onClick={() => toggleTemplate(tpl.id)}
              disabled={disabled}
              title={added ? "Quitar servicio" : "Añadir servicio"}
            >
              <strong>{tpl.label}</strong>
              <span>
                {tpl.description}
                {added ? " · Añadido" : " · Pulsa para añadir"}
              </span>
            </button>
          );
        })}
      </div>
      <div className="field">
        <label>Facturación</label>
        <select
          value={billing}
          onChange={(e) => handleBillingChange(e.target.value)}
          disabled={disabled}
        >
          <option value="MONTHLY">Mensual</option>
          <option value="ANNUAL">Anual (−15% + promo mes 1 IA · pago único)</option>
        </select>
      </div>
      <p className="muted quote-pack-hint">
        Promo confianza mutua: <strong>−{FIRST_MONTH_IA_DISCOUNT_PERCENT}%</strong> en el
        mantenimiento del <strong>mes 1</strong> de packs IA (Starter/Pro/Enterprise). En anual,
        el −40% se aplica sobre la tarifa ya con −15%; pago único de 12 meses. No aplica a web,
        consultoría ni implementación.
      </p>
      <h3 className="quote-pack-heading">Planes IA</h3>
      <div className="quote-pack-picker">
        {PLANS.map((plan) => {
          const selected = lines.some((l) => l.type === "PACK" && l.packId === plan.id);
          const catalog = catalogPriceForPack(plan.id, billing);
          const mes1 =
            billing === "MONTHLY"
              ? firstMonthIaPrice(plan.monthly)
              : firstMonthIaPrice(catalog);
          const upfront =
            billing === "ANNUAL" ? annualUpfrontIaTotal(plan.monthly) : null;
          return (
            <button
              key={plan.id}
              type="button"
              className={`quote-pack-btn${selected ? " quote-pack-btn--active" : ""}`}
              onClick={() => (selected ? removePack(plan.id) : addPack(plan.id))}
              disabled={disabled}
              title={selected ? "Quitar plan" : "Añadir plan"}
            >
              <strong>{plan.name}</strong>
              <span>
                {formatEuro(catalog)}/mes
                {mes1 != null && (
                  <>
                    {" "}
                    · Mes 1: {formatEuro(mes1)} (−{FIRST_MONTH_IA_DISCOUNT_PERCENT}%
                    {billing === "ANNUAL" ? " sobre tarifa anual" : ""})
                  </>
                )}
                {upfront != null && (
                  <> · Pago único 12 meses: {formatEuro(upfront)}</>
                )}
                {selected ? " · Añadido" : ""}
              </span>
            </button>
          );
        })}
      </div>
      <p className="muted quote-pack-hint">
        {lines.length} línea{lines.length === 1 ? "" : "s"} seleccionada
        {lines.length === 1 ? "" : "s"}. Los planes se suman sin sustituir otros servicios.
      </p>
    </>
  );
}
