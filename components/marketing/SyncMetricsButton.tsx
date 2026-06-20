"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SyncMetricsButtonProps {
  label?: string;
}

export default function SyncMetricsButton({
  label = "Sincronizar métricas",
}: SyncMetricsButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSync() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/marketing/metrics/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al sincronizar");

      const { summary } = data;
      setMessage(
        `Actualizado: ${summary.synced} posts · ${summary.failed} errores · ${summary.skipped} omitidos`
      );
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al sincronizar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sync-metrics-wrap">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleSync}
        disabled={loading}
      >
        {loading ? "Sincronizando…" : label}
      </button>
      {message && <p className="sync-metrics-msg muted">{message}</p>}
    </div>
  );
}
