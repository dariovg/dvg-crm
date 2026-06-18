"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import QuoteLineEditor from "@/components/QuoteLineEditor";
import QuoteStatusBadge from "@/components/QuoteStatusBadge";
import {
  saveQuote,
  approveQuote,
  rejectQuote,
  markQuoteSent,
  markQuoteAccepted,
  duplicateQuote,
} from "@/app/actions";
import { PLANS, formatEuro, packLineDescription } from "@/lib/pricing-catalog";
import {
  catalogPriceForPack,
  computeQuoteSubtotal,
  computeQuoteTotal,
  needsApproval,
  QUOTE_BILLING_LABEL,
} from "@/lib/quotes";

export default function QuoteEditor({ quote, isAdmin, canEdit }) {
  const router = useRouter();
  const readOnly = !canEdit || ["SENT", "ACCEPTED"].includes(quote.status);

  const [billing, setBilling] = useState(quote.billing);
  const [notes, setNotes] = useState(quote.notes || "");
  const [discountPercent, setDiscountPercent] = useState(
    quote.discountPercent ?? ""
  );
  const [lines, setLines] = useState(
    quote.lines.map((l) => ({
      type: l.type,
      packId: l.packId,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discountPercent: l.discountPercent,
      sortOrder: l.sortOrder,
    }))
  );
  const [rejectNote, setRejectNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const quoteData = { billing, discountPercent: discountPercent || null };
  const subtotal = computeQuoteSubtotal(lines);
  const total = computeQuoteTotal(
    { discountPercent: discountPercent || null },
    lines
  );
  const requiresApproval = needsApproval(quoteData, lines);

  function syncPackPrices(nextBilling) {
    setLines((prev) =>
      prev.map((line) => {
        if (line.type === "PACK" && line.packId) {
          return {
            ...line,
            unitPrice: catalogPriceForPack(line.packId, nextBilling),
          };
        }
        return line;
      })
    );
  }

  function handleBillingChange(next) {
    setBilling(next);
    syncPackPrices(next);
  }

  function addPack(packId) {
    const price = catalogPriceForPack(packId, billing);
    const withoutOldPack = lines.filter((l) => l.type !== "PACK");
    setLines([
      {
        type: "PACK",
        packId,
        description: packLineDescription(packId),
        quantity: 1,
        unitPrice: price,
        sortOrder: 0,
      },
      ...withoutOldPack.map((l, i) => ({ ...l, sortOrder: i + 1 })),
    ]);
  }

  async function handleSave() {
    setBusy(true);
    setMessage("");
    try {
      const result = await saveQuote(quote.id, {
        lines,
        billing,
        notes,
        discountPercent,
        packId: lines.find((l) => l.type === "PACK")?.packId || null,
      });
      setMessage(
        result.needsApproval
          ? "Guardado — pendiente de aprobación por administración"
          : "Presupuesto guardado"
      );
      router.refresh();
    } catch (e) {
      setMessage(e.message || "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove() {
    setBusy(true);
    try {
      await approveQuote(quote.id);
      router.refresh();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    setBusy(true);
    try {
      await rejectQuote(quote.id, rejectNote);
      router.refresh();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSent() {
    setBusy(true);
    try {
      await markQuoteSent(quote.id);
      router.refresh();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAccepted() {
    setBusy(true);
    try {
      await markQuoteAccepted(quote.id);
      router.refresh();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDuplicate() {
    setBusy(true);
    try {
      const { quoteId } = await duplicateQuote(quote.id);
      router.push(`/presupuestos/${quoteId}`);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="quote-editor">
      <div className="quote-editor-header">
        <div>
          <h2>{quote.number}</h2>
          <p className="quote-editor-meta">
            <QuoteStatusBadge status={quote.status} /> ·{" "}
            {QUOTE_BILLING_LABEL[billing]}
            {requiresApproval && (
              <span className="quote-warning"> · Requiere aprobación</span>
            )}
          </p>
        </div>
        <div className="quote-editor-actions">
          <Link href={`/presupuestos/${quote.id}/pdf`} className="btn-secondary" target="_blank">
            Ver PDF
          </Link>
          <button type="button" className="btn-secondary" onClick={handleDuplicate} disabled={busy}>
            Duplicar
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Cliente</h3>
        <p>
          <strong>{quote.contact.name}</strong>
          {quote.contact.company && ` · ${quote.contact.company}`}
        </p>
        <p>{quote.contact.email}</p>
        {quote.validUntil && (
          <p className="quote-validity">
            Válido hasta: {new Date(quote.validUntil).toLocaleDateString("es-ES")}
          </p>
        )}
      </div>

      {!readOnly && (
        <div className="card">
          <h3>Plan / facturación</h3>
          <div className="field">
            <label>Facturación</label>
            <select value={billing} onChange={(e) => handleBillingChange(e.target.value)}>
              <option value="MONTHLY">Mensual</option>
              <option value="ANNUAL">Anual (−15%)</option>
            </select>
          </div>
          <div className="quote-pack-picker">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                className={`quote-pack-btn${
                  lines.some((l) => l.packId === plan.id) ? " quote-pack-btn--active" : ""
                }`}
                onClick={() => addPack(plan.id)}
              >
                <strong>{plan.name}</strong>
                <span>
                  {formatEuro(catalogPriceForPack(plan.id, billing))}/mes
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3>Líneas</h3>
        <QuoteLineEditor lines={lines} onChange={setLines} readOnly={readOnly} />
        <div className="quote-totals">
          <div>
            <span>Subtotal</span>
            <strong>{formatEuro(subtotal)}</strong>
          </div>
          {!readOnly && (
            <div className="field quote-global-discount">
              <label>Descuento global (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="—"
              />
            </div>
          )}
          {discountPercent ? (
            <div>
              <span>Descuento global</span>
              <strong>{discountPercent}%</strong>
            </div>
          ) : null}
          <div className="quote-total-row">
            <span>Total {billing === "ANNUAL" ? "(mensual, plan anual)" : "(mensual)"}</span>
            <strong>{formatEuro(total)}</strong>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Notas internas</h3>
        {readOnly ? (
          <p>{notes || "—"}</p>
        ) : (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Notas para el equipo (no aparecen en el PDF)"
          />
        )}
      </div>

      {quote.approvalNote && quote.status === "REJECTED" && (
        <div className="card quote-reject-note">
          <strong>Motivo de rechazo:</strong> {quote.approvalNote}
        </div>
      )}

      {message && <p className="form-message">{message}</p>}

      <div className="quote-footer-actions">
        {canEdit && !readOnly && (
          <button type="button" className="btn-primary" onClick={handleSave} disabled={busy}>
            Guardar
          </button>
        )}
        {canEdit && quote.status !== "PENDING_APPROVAL" && quote.status !== "SENT" && quote.status !== "ACCEPTED" && !requiresApproval && (
          <button type="button" className="btn-secondary" onClick={handleSent} disabled={busy}>
            Marcar enviado
          </button>
        )}
        {canEdit && quote.status === "SENT" && (
          <button type="button" className="btn-primary" onClick={handleAccepted} disabled={busy}>
            Marcar aceptado
          </button>
        )}
        {isAdmin && quote.status === "PENDING_APPROVAL" && (
          <>
            <button type="button" className="btn-primary" onClick={handleApprove} disabled={busy}>
              Aprobar
            </button>
            <div className="quote-reject-form">
              <input
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Motivo de rechazo (opcional)"
              />
              <button type="button" className="btn-danger" onClick={handleReject} disabled={busy}>
                Rechazar
              </button>
            </div>
          </>
        )}
        {isAdmin && quote.status === "APPROVED" && (
          <button type="button" className="btn-secondary" onClick={handleSent} disabled={busy}>
            Marcar enviado
          </button>
        )}
      </div>
    </div>
  );
}
