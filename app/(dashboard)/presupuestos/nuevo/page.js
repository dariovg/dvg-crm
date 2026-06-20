"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { createQuote } from "@/app/actions";
import QuoteServicesPicker from "@/components/QuoteServicesPicker";
import { formatEuro } from "@/lib/pricing-catalog";
import { computeQuoteTotalWithVat } from "@/lib/quotes";

function NuevoPresupuestoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactId = searchParams.get("contactId");
  const [lines, setLines] = useState([]);
  const [billing, setBilling] = useState("MONTHLY");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const totalWithVat = computeQuoteTotalWithVat({ discountPercent: null }, lines);

  useEffect(() => {
    if (!contactId) setError("Falta contactId — abre desde un lead");
  }, [contactId]);

  async function submit(e) {
    e.preventDefault();
    if (!contactId) return;
    if (!lines.length) {
      setError("Añade al menos un servicio (Web / App, plan IA, etc.)");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { quoteId } = await createQuote(contactId, { lines, billing });
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
        <h2>Servicios del presupuesto</h2>
        <p className="page-lead">
          Añade todos los servicios que necesites. Puedes combinar web y agente IA en la misma factura.
        </p>
        <QuoteServicesPicker
          lines={lines}
          onChange={setLines}
          billing={billing}
          onBillingChange={setBilling}
          disabled={busy}
        />
        {lines.length > 0 && (
          <p className="quote-create-total">
            Total estimado: <strong>{formatEuro(totalWithVat)}/mes (IVA incl.)</strong>
          </p>
        )}
      </section>

      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn-primary" disabled={busy || !lines.length}>
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
