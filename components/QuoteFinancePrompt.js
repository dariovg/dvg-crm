"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { createIncomeFromQuote } from "@/app/actions";
import { formatEuro } from "@/lib/pricing-catalog";
import { buildIncomeFromQuote } from "@/lib/finance-from-quote";

export default function QuoteFinancePrompt({ quote, lines, existingEntry }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (quote.status !== "ACCEPTED" || existingEntry) return null;

  const draft = buildIncomeFromQuote(quote, lines);

  async function handleCreate() {
    setBusy(true);
    setError("");
    try {
      await createIncomeFromQuote(quote.id);
      router.refresh();
    } catch (e) {
      setError(e.message || "Error al registrar ingreso");
    }
    setBusy(false);
  }

  return (
    <div className="card quote-finance-prompt">
      <h3>Registrar ingreso en finanzas</h3>
      <p className="muted">
        Presupuesto aceptado: puedes crear un movimiento de ingreso (
        {quote.billing === "ANNUAL" ? "pago anual único" : "mensual recurrente"}).
      </p>
      <ul className="quote-finance-summary">
        <li>
          <span>Importe sugerido (IVA incl.)</span>
          <strong>{formatEuro(draft.amount)}</strong>
        </li>
        <li>
          <span>Tipo</span>
          <strong>{draft.recurring ? "Recurrente mensual" : "Pago único"}</strong>
        </li>
      </ul>
      {error && <p className="form-error">{error}</p>}
      <div className="quote-finance-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={handleCreate}
          disabled={busy}
        >
          Crear ingreso
        </button>
        <Link href="/ceo/finanzas" className="btn-secondary">
          Ir a finanzas
        </Link>
      </div>
    </div>
  );
}
