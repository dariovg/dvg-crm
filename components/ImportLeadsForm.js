"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { importLeadsFromCsv } from "@/app/actions";

export default function ImportLeadsForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [pending, setPending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setPending(true);
    setResult(null);
    try {
      const r = await importLeadsFromCsv(text);
      setResult(r);
      router.refresh();
    } catch (err) {
      setResult({ error: err.message });
    }
    setPending(false);
  }

  return (
    <div className="card">
      <h2>Importar CSV</h2>
      <p className="page-lead" style={{ marginBottom: "1rem" }}>
        Columnas: nombre, email, telefono, empresa, interes, valor (€). Primera fila =
        cabeceras.
      </p>
      <form onSubmit={submit}>
        <textarea
          className="import-csv-area"
          rows={8}
          placeholder={'nombre,email,telefono\nJuan,juan@ejemplo.com,612345678'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={pending || !text.trim()}>
          Importar
        </button>
      </form>
      {result && !result.error && (
        <p className="import-result">
          Creados: {result.created} · Duplicados omitidos: {result.skipped} · Errores:{" "}
          {result.errors}
        </p>
      )}
      {result?.error && <p className="form-error">{result.error}</p>}
    </div>
  );
}
