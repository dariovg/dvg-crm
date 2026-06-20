"use client";

import { formatEuro } from "@/lib/pricing-catalog";
import { computeLineTotal, computeLineVat, VAT_RATE } from "@/lib/quotes";

export default function QuoteLineEditor({ lines, onChange, readOnly = false, compact = false }) {
  const vatPercent = Math.round(VAT_RATE * 100);
  function updateLine(index, field, value) {
    const next = lines.map((l, i) =>
      i === index ? { ...l, [field]: value } : l
    );
    onChange(next);
  }

  function removeLine(index) {
    onChange(lines.filter((_, i) => i !== index));
  }

  function addCustomLine() {
    onChange([
      ...lines,
      {
        type: "CUSTOM",
        description: "",
        quantity: 1,
        unitPrice: 0,
        discountPercent: null,
        sortOrder: lines.length,
      },
    ]);
  }

  function addDiscountLine() {
    onChange([
      ...lines,
      {
        type: "CUSTOM",
        description: "Descuento comercial",
        quantity: 1,
        unitPrice: 0,
        discountPercent: null,
        sortOrder: lines.length,
      },
    ]);
  }

  return (
    <div className="quote-lines">
      <table className="data-table quote-lines-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Cant.</th>
            <th>Precio unit.</th>
            {!compact && <th>Dto. %</th>}
            <th>Base</th>
            <th>IVA {vatPercent}%</th>
            <th>Total</th>
            {!readOnly && <th />}
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i}>
              <td>
                {readOnly ? (
                  <pre className="quote-line-desc">{line.description}</pre>
                ) : (
                  <textarea
                    value={line.description}
                    onChange={(e) => updateLine(i, "description", e.target.value)}
                    rows={line.type === "PACK" ? 4 : 2}
                    className="quote-line-textarea"
                  />
                )}
              </td>
              <td>
                {readOnly ? (
                  line.quantity
                ) : (
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(i, "quantity", parseInt(e.target.value, 10) || 1)
                    }
                    className="quote-line-input-sm"
                  />
                )}
              </td>
              <td>
                {readOnly ? (
                  formatEuro(line.unitPrice)
                ) : (
                  <input
                    type="number"
                    value={line.unitPrice}
                    onChange={(e) =>
                      updateLine(i, "unitPrice", parseInt(e.target.value, 10) || 0)
                    }
                    className="quote-line-input-sm"
                  />
                )}
              </td>
              {!compact && (
                <td>
                  {readOnly ? (
                    line.discountPercent ? `${line.discountPercent}%` : "—"
                  ) : (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="—"
                      value={line.discountPercent ?? ""}
                      onChange={(e) =>
                        updateLine(
                          i,
                          "discountPercent",
                          e.target.value === "" ? null : parseInt(e.target.value, 10)
                        )
                      }
                      className="quote-line-input-sm"
                    />
                  )}
                </td>
              )}
              <td>{formatEuro(computeLineTotal(line))}</td>
              <td>{formatEuro(computeLineVat(line))}</td>
              <td>{formatEuro(computeLineTotal(line) + computeLineVat(line))}</td>
              {!readOnly && (
                <td>
                  <button
                    type="button"
                    className="btn-ghost-sm"
                    onClick={() => removeLine(i)}
                    title="Eliminar línea"
                  >
                    ×
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <div className="quote-line-actions">
          <button type="button" className="btn-secondary" onClick={addCustomLine}>
            + Línea personalizada
          </button>
          <button type="button" className="btn-secondary" onClick={addDiscountLine}>
            + Línea descuento
          </button>
        </div>
      )}
    </div>
  );
}
