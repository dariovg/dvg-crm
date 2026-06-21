"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Accordion from "@/components/Accordion";
import QuoteLineEditor from "@/components/QuoteLineEditor";
import QuoteServicesPicker from "@/components/QuoteServicesPicker";
import QuoteSharePanel from "@/components/QuoteSharePanel";
import QuoteStatusBadge from "@/components/QuoteStatusBadge";
import QuoteDeleteButton from "@/components/QuoteDeleteButton";
import {
  saveQuote,
  approveQuote,
  rejectQuote,
  markQuoteSent,
  markQuoteAccepted,
  duplicateQuote,
} from "@/app/actions";
import { formatEuro } from "@/lib/pricing-catalog";
import {
  computeQuoteSubtotal,
  computeQuoteTotal,
  computeQuoteVat,
  computeQuoteTotalWithVat,
  needsApproval,
  QUOTE_BILLING_LABEL,
  VAT_RATE,
  hasIaFirstMonthPromo,
  countIaContractMonths,
  FIRST_MONTH_IA_DISCOUNT_PERCENT,
} from "@/lib/quotes";
import {
  resolveQuoteProjectLabel,
  inferProjectTypeFromLines,
} from "@/lib/quote-templates";

export default function QuoteEditor({ quote, isAdmin, canEdit, canDelete = false }) {
  const router = useRouter();
  const readOnly = !canEdit || ["SENT", "ACCEPTED"].includes(quote.status);
  const showShare = ["SENT", "ACCEPTED"].includes(quote.status);

  const [billing, setBilling] = useState(quote.billing);
  const [projectType, setProjectType] = useState(quote.projectType || "IA");
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

  const subtotal = computeQuoteSubtotal(lines, billing);
  const quoteMeta = { discountPercent: discountPercent || null };
  const baseTotal = computeQuoteTotal(quoteMeta, lines);
  const vatTotal = computeQuoteVat(quoteMeta, lines);
  const totalWithVat = computeQuoteTotalWithVat(quoteMeta, lines);
  const vatPercent = Math.round(VAT_RATE * 100);
  const requiresApproval = needsApproval({ billing, discountPercent: discountPercent || null }, lines);
  const projectLabel = resolveQuoteProjectLabel(lines, projectType);

  async function handleSave() {
    setBusy(true);
    setMessage("");
    try {
      const result = await saveQuote(quote.id, {
        lines,
        billing,
        notes,
        discountPercent,
        projectType: inferProjectTypeFromLines(lines, projectType),
        packId: lines.find((l) => l.type === "PACK")?.packId ?? null,
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
            {projectLabel} ·{" "}
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

      <div className="quote-summary-bar">
        <span>{quote.contact.name}</span>
        <strong>{formatEuro(totalWithVat)}/mes (IVA incl.)</strong>
      </div>

      <Accordion
        title="Cliente"
        subtitle={`${quote.contact.email}${quote.contact.company ? ` · ${quote.contact.company}` : ""}`}
        defaultOpen={false}
      >
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
      </Accordion>

      {!readOnly && (
        <Accordion
          title="Servicios del presupuesto"
          subtitle={projectLabel}
          defaultOpen
          badge={formatEuro(totalWithVat)}
        >
          <QuoteServicesPicker
            lines={lines}
            onChange={(next) => {
              setLines(next);
              setProjectType(inferProjectTypeFromLines(next, projectType));
            }}
            billing={billing}
            onBillingChange={setBilling}
            disabled={busy || readOnly}
          />
        </Accordion>
      )}

      <Accordion
        title="Líneas del presupuesto"
        subtitle={`${lines.length} líneas · ${formatEuro(subtotal)} subtotal`}
        defaultOpen
      >
        <QuoteLineEditor lines={lines} onChange={setLines} readOnly={readOnly} compact={!readOnly} billing={billing} />
        {hasIaFirstMonthPromo(lines) && (
          <p className="muted quote-pack-hint">
            Contrato IA: suma líneas <strong>Mes 1</strong> (−{FIRST_MONTH_IA_DISCOUNT_PERCENT}%) y{" "}
            <strong>Mes normal</strong> (cantidad = meses restantes).
            {countIaContractMonths(lines) > 0 && (
              <>
                {" "}
                Total: <strong>{countIaContractMonths(lines)} mes(es)</strong> de mantenimiento.
              </>
            )}
          </p>
        )}
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
          <div>
            <span>Base imponible</span>
            <strong>{formatEuro(baseTotal)}</strong>
          </div>
          <div>
            <span>IVA ({vatPercent}%)</span>
            <strong>{formatEuro(vatTotal)}</strong>
          </div>
          <div className="quote-total-row">
            <span>Total contrato con IVA</span>
            <strong>{formatEuro(totalWithVat)}</strong>
          </div>
        </div>
      </Accordion>

      <Accordion title="Notas internas" subtitle={notes ? "Con notas" : "Vacío"} defaultOpen={false}>
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
      </Accordion>

      {showShare && (
        <Accordion
          title="Envío y seguimiento"
          subtitle={
            quote.pdfOpenCount > 0
              ? `${quote.pdfOpenCount} apertura${quote.pdfOpenCount === 1 ? "" : "s"}`
              : "Sin aperturas"
          }
          defaultOpen
        >
          <QuoteSharePanel quote={quote} />
        </Accordion>
      )}

      {quote.approvalNote && quote.status === "REJECTED" && (
        <div className="card quote-reject-note">
          <strong>Motivo de rechazo:</strong> {quote.approvalNote}
        </div>
      )}

      {message && <p className="form-message">{message}</p>}

      {canDelete && (
        <div className="card contact-editor-danger">
          <h3>Zona de peligro</h3>
          <p className="muted">
            Elimina este presupuesto si se creó por error. No afecta al lead ni a otros presupuestos.
          </p>
          <QuoteDeleteButton
            quoteId={quote.id}
            quoteNumber={quote.number}
            redirectTo={`/leads/${quote.contactId}`}
            className="btn-danger"
            label="Eliminar presupuesto"
          />
        </div>
      )}

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
        {canEdit && quote.status === "SENT" && !quote.signedAt && (
          <button type="button" className="btn-primary" onClick={handleAccepted} disabled={busy}>
            Marcar aceptado (manual)
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
