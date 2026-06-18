"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { createQuote } from "@/app/actions";
import { PLANS, formatEuro } from "@/lib/pricing-catalog";
import { catalogPriceForPack } from "@/lib/quotes";

function NuevoPresupuestoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactId = searchParams.get("contactId");
  const [packId, setPackId] = useState("pro");
  const [billing, setBilling] = useState("MONTHLY");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!contactId) setError("Falta contactId — abre desde un lead");
  }, [contactId]);

  async function submit(e) {
    e.preventDefault();
    if (!contactId) return;
    setBusy(true);
    setError("");
    try {
      const { quoteId } = await createQuote(contactId, { packId, billing });
      router.push(`/presupuestos/${quoteId}`);
    } catch (err) {
      setError(err.message || "Error al crear");
      setBusy(false);
    }
  }

  if (!contactId) {
    return (
      <div className="card">
        <p>Selecciona un lead para crear un presupuesto.</p>
        <Link href="/leads" className="btn-primary">
          Ir a leads
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card">
      <h2>Nuevo presupuesto</h2>
      <div className="field">
        <label>Plan</label>
        <div className="quote-pack-picker">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              className={`quote-pack-btn${packId === plan.id ? " quote-pack-btn--active" : ""}`}
              onClick={() => setPackId(plan.id)}
            >
              <strong>{plan.name}</strong>
              <span>{formatEuro(catalogPriceForPack(plan.id, billing))}/mes</span>
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Facturación</label>
        <select value={billing} onChange={(e) => setBilling(e.target.value)}>
          <option value="MONTHLY">Mensual</option>
          <option value="ANNUAL">Anual (−15%)</option>
        </select>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "Creando…" : "Crear presupuesto"}
      </button>
    </form>
  );
}

export default function NuevoPresupuestoPage() {
  return (
    <>
      <h1 className="page-title">Nuevo presupuesto</h1>
      <Suspense fallback={<p>Cargando…</p>}>
        <NuevoPresupuestoForm />
      </Suspense>
    </>
  );
}
