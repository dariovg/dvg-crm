"use client";

import {
  PLANS,
  formatEuro,
  buildIaFirstMonthLine,
  buildIaRegularMonthLine,
  isIaFirstMonthLine,
  isIaRegularMonthLine,
  iaFirstMonthLineDescription,
  iaRegularMonthLineDescription,
  firstMonthIaPrice,
  packUnitPrice,
  FIRST_MONTH_IA_DISCOUNT_PERCENT,
} from "@/lib/pricing-catalog";
import { catalogPriceForPack, countIaContractMonths } from "@/lib/quotes";
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
  function reindex(next) {
    return next.map((l, i) => ({ ...l, sortOrder: i }));
  }

  function syncPackPrices(nextBilling) {
    onChange(
      reindex(
        lines.map((line) => {
          if (line.type === "PACK" && line.packId) {
            return {
              ...line,
              unitPrice: catalogPriceForPack(line.packId, nextBilling),
              description: isIaFirstMonthLine(line)
                ? iaFirstMonthLineDescription(line.packId, nextBilling)
                : iaRegularMonthLineDescription(line.packId, nextBilling),
            };
          }
          return line;
        })
      )
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
        iaRegularMonthLineDescription
      );
      nextLines = reindex([...lines, ...added]);
    }
    onChange(nextLines);
  }

  function hasFirstMonthLine(packId) {
    return lines.some((l) => isIaFirstMonthLine(l) && l.packId === packId);
  }

  function findRegularMonthLine(packId) {
    return lines.find(
      (l) => isIaRegularMonthLine(l) && l.packId === packId && !l.discountPercent
    );
  }

  function addFirstMonth(packId) {
    if (disabled || hasFirstMonthLine(packId)) return;
    onChange(reindex([...lines, buildIaFirstMonthLine(packId, billing, lines.length)]));
  }

  function addRegularMonth(packId, quantity = 1) {
    if (disabled) return;
    const existing = findRegularMonthLine(packId);
    if (existing) {
      onChange(
        reindex(
          lines.map((l) =>
            l === existing
              ? { ...l, quantity: (l.quantity || 1) + quantity }
              : l
          )
        )
      );
      return;
    }
    onChange(
      reindex([...lines, buildIaRegularMonthLine(packId, billing, quantity, lines.length)])
    );
  }

  function removePackLines(packId) {
    if (disabled) return;
    onChange(reindex(lines.filter((l) => !(l.type === "PACK" && l.packId === packId))));
  }

  const contractMonths = countIaContractMonths(lines);

  return (
    <>
      <p className="muted quote-pack-hint" style={{ marginTop: 0 }}>
        Pulsa cada servicio para <strong>añadirlo o quitarlo</strong>. En planes IA elige{" "}
        <strong>Mes 1</strong> (promo −40%) y <strong>Meses normales</strong> (cantidad en la
        tabla). Ejemplo contrato 4 meses: 1× Mes 1 + 3× Mes normal.
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
          <option value="MONTHLY">Mensual (tarifa catálogo)</option>
          <option value="ANNUAL">Anual (−15% en tarifa mensual)</option>
        </select>
      </div>
      <h3 className="quote-pack-heading">Planes IA — mantenimiento</h3>
      <div className="quote-pack-month-grid">
        {PLANS.map((plan) => {
          const rate = packUnitPrice(plan.id, billing);
          const mes1 = firstMonthIaPrice(rate);
          const hasFirst = hasFirstMonthLine(plan.id);
          const regular = findRegularMonthLine(plan.id);
          const hasAny = lines.some((l) => l.type === "PACK" && l.packId === plan.id);

          return (
            <div
              key={plan.id}
              className={`quote-pack-month-card${hasAny ? " quote-pack-month-card--active" : ""}`}
            >
              <div className="quote-pack-month-card-head">
                <strong>{plan.name}</strong>
                <span className="muted">{formatEuro(rate)}/mes</span>
              </div>
              <div className="quote-pack-month-actions">
                <button
                  type="button"
                  className={`btn-secondary btn-sm${hasFirst ? " quote-pack-month-btn--added" : ""}`}
                  onClick={() => addFirstMonth(plan.id)}
                  disabled={disabled || hasFirst}
                  title="Mes 1 con promo confianza mutua"
                >
                  + Mes 1 ({formatEuro(mes1)})
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => addRegularMonth(plan.id, 1)}
                  disabled={disabled}
                  title="Añade un mes normal; edita la cantidad en la tabla"
                >
                  + Mes normal ({formatEuro(rate)})
                </button>
                {hasAny && (
                  <button
                    type="button"
                    className="btn-ghost-sm"
                    onClick={() => removePackLines(plan.id)}
                    disabled={disabled}
                    title="Quitar todas las líneas de este plan"
                  >
                    Quitar plan
                  </button>
                )}
              </div>
              {regular && (
                <p className="muted quote-pack-month-meta">
                  Meses normales añadidos: <strong>{regular.quantity || 1}</strong> (edita cantidad
                  abajo)
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="muted quote-pack-hint">
        {lines.length} línea{lines.length === 1 ? "" : "s"}
        {contractMonths > 0 && (
          <>
            {" "}
            · <strong>{contractMonths} mes(es)</strong> de mantenimiento IA en total
          </>
        )}
        . Promo mes 1: −{FIRST_MONTH_IA_DISCOUNT_PERCENT}% (solo packs IA).
      </p>
    </>
  );
}
