"use client";

import { useState } from "react";
import QuoteSignaturePad from "@/components/QuoteSignaturePad";
import { signQuoteByToken } from "@/app/quote-public-actions";

export default function QuoteSignForm({ token, quoteNumber, contactName }) {
  const [payload, setPayload] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!payload) {
      setError("Añade tu firma o escribe tu nombre");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signQuoteByToken(token, payload);
      setDone(true);
    } catch (err) {
      setError(err.message || "No se pudo registrar la firma");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="quote-public-card quote-public-success">
        <h2>¡Presupuesto aceptado!</h2>
        <p>
          Hemos registrado tu firma para el presupuesto <strong>{quoteNumber}</strong>.
          En breve nos pondremos en contacto contigo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="quote-public-card">
      <h2>Aceptar presupuesto</h2>
      <p className="quote-public-lead">
        {contactName ? `${contactName}, ` : ""}
        confirma tu aceptación del presupuesto <strong>{quoteNumber}</strong>.
      </p>
      <QuoteSignaturePad onChange={setPayload} disabled={busy} />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn-primary" disabled={busy || !payload}>
        {busy ? "Registrando…" : "Aceptar y firmar"}
      </button>
    </form>
  );
}
