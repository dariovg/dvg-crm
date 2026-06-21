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
  linkedin: {
    appConfigured: boolean;
    connected: boolean;
    openId?: string | null;
    expiresAt?: string | null;
    organizationUrn?: string | null;
  };
  youtube: {
    appConfigured: boolean;
    connected: boolean;
    channelId?: string | null;
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
  const linkedinResult = searchParams.get("linkedin");
  const linkedinMsg = searchParams.get("msg");
  const youtubeResult = searchParams.get("youtube");
  const youtubeMsg = searchParams.get("msg");

  useEffect(() => {
    fetch("/api/marketing/status")
      .then((r) => r.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  }, [tiktokResult, linkedinResult, youtubeResult]);

  if (loading) {
    return <ConexionesSkeleton />;
  }

  const tt = status?.tiktok;
  const li = status?.linkedin;
  const yt = status?.youtube;

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
      {linkedinResult === "ok" && (
        <div className="alert alert-info">LinkedIn conectado.</div>
      )}
      {linkedinResult === "error" && (
        <div className="alert alert-warn">
          No se pudo conectar LinkedIn{linkedinMsg ? `: ${linkedinMsg}` : ""}.
        </div>
      )}
      {youtubeResult === "ok" && (
        <div className="alert alert-info">YouTube conectado.</div>
      )}
      {youtubeResult === "error" && (
        <div className="alert alert-warn">
          No se pudo conectar YouTube{youtubeMsg ? `: ${youtubeMsg}` : ""}.
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

      <section className="panel marketing-section">
        <h2 className="panel-title">LinkedIn</h2>
        <p className="muted">
          Servidor: {li?.appConfigured ? "Listo" : "No configurado"}
        </p>
        <p className="muted">
          Cuenta: {li?.connected ? "Conectada" : "Sin conectar"}
        </p>
        {li?.organizationUrn && (
          <p className="muted field-hint">
            Publicación en página: {li.organizationUrn}
          </p>
        )}

        {li?.appConfigured && canConnect && (
          <div className="mt-3">
            <a
              href="/api/marketing/connect/linkedin"
              className="btn btn-primary"
            >
              {li.connected ? "Reconectar LinkedIn" : "Conectar LinkedIn"}
            </a>
          </div>
        )}
        {li?.appConfigured && !canConnect && (
          <p className="muted field-hint">Solo administración puede conectar cuentas.</p>
        )}
      </section>

      <section className="panel marketing-section">
        <h2 className="panel-title">YouTube</h2>
        <p className="muted">
          Servidor: {yt?.appConfigured ? "Listo" : "No configurado"}
        </p>
        <p className="muted">
          Canal: {yt?.connected ? "Conectado" : "Sin conectar"}
        </p>
        {yt?.channelId && (
          <p className="muted field-hint">Canal ID: {yt.channelId}</p>
        )}

        {yt?.appConfigured && canConnect && (
          <div className="mt-3">
            <a
              href="/api/marketing/connect/youtube"
              className="btn btn-primary"
            >
              {yt.connected ? "Reconectar YouTube" : "Conectar YouTube"}
            </a>
          </div>
        )}
        {yt?.appConfigured && !canConnect && (
          <p className="muted field-hint">Solo administración puede conectar cuentas.</p>
        )}
      </section>
    </div>
  );
}
