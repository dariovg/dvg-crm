"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { createQuote } from "@/app/actions";
import { PLANS, formatEuro } from "@/lib/pricing-catalog";
import { catalogPriceForPack } from "@/lib/quotes";
import { QUOTE_TEMPLATES } from "@/lib/quote-templates";

function NuevoPresupuestoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactId = searchParams.get("contactId");
  const [projectType, setProjectType] = useState("IA");
  const [packId, setPackId] = useState("pro");
  const [billing, setBilling] = useState("MONTHLY");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const tpl = QUOTE_TEMPLATES[projectType];

  useEffect(() => {
    if (tpl?.defaultPackId) setPackId(tpl.defaultPackId);
    if (tpl?.defaultBilling) setBilling(tpl.defaultBilling);
  }, [projectType, tpl?.defaultBilling, tpl?.defaultPackId]);

  useEffect(() => {
    if (!contactId) setError("Falta contactId — abre desde un lead");
  }, [contactId]);

  async function submit(e) {
    e.preventDefault();
    if (!contactId) return;
    setBusy(true);
    setError("");
    try {
      const { quoteId } = await createQuote(contactId, {
        packId: tpl?.defaultPackId ? tpl.defaultPackId : packId,
        billing,
        projectType,
        useTemplate: true,
      });
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
    <form onSubmit={submit} className="quote-create-form">
      <section className="card">
        <h2>Tipo de proyecto</h2>
        <p className="page-lead">Elige una plantilla base. Podrás ajustar líneas después.</p>
        <div className="quote-template-picker">
          {Object.values(QUOTE_TEMPLATES).map((t) => (
            <button
              key={t.id}
              type="button"
              className={`quote-template-btn${
                projectType === t.id ? " quote-template-btn--active" : ""
              }`}
              onClick={() => setProjectType(t.id)}
            >
              <strong>{t.label}</strong>
              <span>{t.description}</span>
            </button>
          ))}
        </div>
      </section>

      {projectType === "IA" && (
        <section className="card">
          <h3>Plan IA</h3>
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
          <div className="field">
            <label>Facturación</label>
            <select value={billing} onChange={(e) => setBilling(e.target.value)}>
              <option value="MONTHLY">Mensual</option>
              <option value="ANNUAL">Anual (−15%)</option>
            </select>
          </div>
        </section>
      )}

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
