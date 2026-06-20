"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { canConnectMarketingAccounts } from "@/lib/permissions";
import { ConexionesSkeleton } from "@/components/Skeleton";

interface ConnectionStatus {
  tiktok: {
    appConfigured: boolean;
    connected: boolean;
    openId?: string | null;
    expiresAt?: string | null;
  };
  twitter: boolean;
  configuredPlatforms: string[];
}

export default function MarketingConexionesPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const canConnect = canConnectMarketingAccounts(session);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const tiktokResult = searchParams.get("tiktok");
  const tiktokMsg = searchParams.get("msg");

  useEffect(() => {
    fetch("/api/marketing/status")
      .then((r) => r.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  }, [tiktokResult]);

  if (loading) {
    return <ConexionesSkeleton />;
  }

  const tt = status?.tiktok;

  return (
    <div className="page-pad">
      <header className="page-head">
        <div>
          <h1>Conexiones</h1>
          <p className="page-sub">Estado de las cuentas para publicar</p>
        </div>
      </header>

      {tiktokResult === "ok" && (
        <div className="alert alert-info">TikTok conectado.</div>
      )}
      {tiktokResult === "error" && (
        <div className="alert alert-warn">
          No se pudo conectar TikTok{tiktokMsg ? `: ${tiktokMsg}` : ""}.
        </div>
      )}

      <section className="panel marketing-section">
        <h2 className="panel-title">𝕏</h2>
        <p className="muted">
          {status?.twitter ? "Listo para publicar" : "No configurado"}
        </p>
      </section>

      <section className="panel marketing-section">
        <h2 className="panel-title">TikTok</h2>
        <p className="muted">
          Servidor: {tt?.appConfigured ? "Listo" : "No configurado"}
        </p>
        <p className="muted">
          Cuenta: {tt?.connected ? "Conectada" : "Sin conectar"}
        </p>

        {tt?.appConfigured && canConnect && (
          <div className="mt-3">
            <a href="/api/marketing/connect/tiktok" className="btn btn-primary">
              {tt.connected ? "Reconectar TikTok" : "Conectar TikTok"}
            </a>
          </div>
        )}
        {tt?.appConfigured && !canConnect && (
          <p className="muted field-hint">Solo administración puede conectar cuentas.</p>
        )}
      </section>
    </div>
  );
}
