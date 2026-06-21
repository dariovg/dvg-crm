"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteQuote } from "@/app/actions";

export default function QuoteDeleteButton({
  quoteId,
  quoteNumber,
  redirectTo,
  className = "btn-link-sm btn-link-danger",
  label = "Eliminar",
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    const ok = window.confirm(
      `¿Eliminar el presupuesto ${quoteNumber}?\n\nEsta acción no se puede deshacer.`
    );
    if (!ok) return;
    setBusy(true);
    try {
      await deleteQuote(quoteId);
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch (err) {
      window.alert(err.message || "No se pudo eliminar el presupuesto");
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleDelete}
      disabled={busy}
    >
      {busy ? "Eliminando…" : label}
    </button>
  );
}
