"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Accordion from "@/components/Accordion";
import QuoteLineEditor from "@/components/QuoteLineEditor";
import QuoteSharePanel from "@/components/QuoteSharePanel";
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
  computeQuoteVat,
  computeQuoteTotalWithVat,
  needsApproval,
  QUOTE_BILLING_LABEL,
  VAT_RATE,
} from "@/lib/quotes";
import {
  QUOTE_PROJECT_LABEL,
  QUOTE_TEMPLATES,
  isTemplateInLines,
  appendTemplateLines,
  removeTemplateFromLines,
  resolveQuoteProjectLabel,
  inferProjectTypeFromLines,
} from "@/lib/quote-templates";

export default function QuoteEditor({ quote, isAdmin, canEdit }) {
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

  const subtotal = computeQuoteSubtotal(lines);
  const quoteMeta = { discountPercent: discountPercent || null };
  const baseTotal = computeQuoteTotal(quoteMeta, lines);
  const vatTotal = computeQuoteVat(quoteMeta, lines);
  const totalWithVat = computeQuoteTotalWithVat(quoteMeta, lines);
  const vatPercent = Math.round(VAT_RATE * 100);
  const requiresApproval = needsApproval({ billing, discountPercent: discountPercent || null }, lines);
  const projectLabel = resolveQuoteProjectLabel(lines, projectType);

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
    if (lines.some((l) => l.type === "PACK" && l.packId === packId)) return;
    const price = catalogPriceForPack(packId, billing);
    setLines([
      ...lines,
      {
        type: "PACK",
        packId,
        description: packLineDescription(packId),
        quantity: 1,
        unitPrice: price,
        sortOrder: lines.length,
      },
    ]);
  }

  function removePack(packId) {
    setLines(lines.filter((l) => !(l.type === "PACK" && l.packId === packId)));
  }

  function toggleTemplate(type) {
    if (readOnly) return;
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
    setLines(nextLines);
    setProjectType(inferProjectTypeFromLines(nextLines, projectType));
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
          <p className="muted quote-pack-hint" style={{ marginTop: 0 }}>
            Pulsa cada servicio para <strong>añadirlo o quitarlo</strong>. Puedes combinar, por ejemplo,{" "}
            <strong>Web / App + Agente IA</strong> en el mismo presupuesto.
          </p>
          <div className="quote-template-picker">
            {Object.values(QUOTE_TEMPLATES).map((tpl) => {
              const added = isTemplateInLines(tpl.id, lines);
              return (
              <button
                key={tpl.id}
                type="button"
                className={`quote-template-btn${
                  added ? " quote-template-btn--active" : ""
                }`}
                onClick={() => toggleTemplate(tpl.id)}
                disabled={busy}
                title={added ? "Quitar servicio del presupuesto" : "Añadir servicio al presupuesto"}
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
            <select value={billing} onChange={(e) => handleBillingChange(e.target.value)}>
              <option value="MONTHLY">Mensual</option>
              <option value="ANNUAL">Anual (−15%)</option>
            </select>
          </div>
          <div className="quote-pack-picker">
            {PLANS.map((plan) => {
              const selected = lines.some((l) => l.type === "PACK" && l.packId === plan.id);
              return (
                <button
                  key={plan.id}
                  type="button"
                  className={`quote-pack-btn${selected ? " quote-pack-btn--active" : ""}`}
                  onClick={() => (selected ? removePack(plan.id) : addPack(plan.id))}
                  title={selected ? "Quitar plan del presupuesto" : "Añadir plan al presupuesto"}
                >
                  <strong>{plan.name}</strong>
                  <span>
                    {formatEuro(catalogPriceForPack(plan.id, billing))}/mes
                    {selected ? " · Añadido" : ""}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="muted quote-pack-hint">
            Los planes IA (Starter, Pro…) se suman igual: pulsa para añadir o quitar cada uno.
          </p>
        </Accordion>
      )}

      <Accordion
        title="Líneas del presupuesto"
        subtitle={`${lines.length} líneas · ${formatEuro(subtotal)} subtotal`}
        defaultOpen
      >
        <QuoteLineEditor lines={lines} onChange={setLines} readOnly={readOnly} compact={!readOnly} />
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
            <span>Total {billing === "ANNUAL" ? "(mensual, plan anual)" : "(mensual)"} con IVA</span>
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
