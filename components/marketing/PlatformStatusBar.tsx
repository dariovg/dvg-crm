"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { canConnectMarketingAccounts } from "@/lib/permissions";

type OAuthPlatform = "tiktok" | "youtube" | "linkedin";

type PlatformStatus = {
  twitter: {
    configured?: boolean;
    ready: boolean;
    missing?: string[];
    error?: string | null;
    username?: string | null;
  };
  tiktok: { appConfigured: boolean; connected: boolean };
  youtube: { appConfigured: boolean; connected: boolean };
  linkedin: { appConfigured: boolean; connected: boolean };
};

const ITEMS: {
  key: "TWITTER" | "TIKTOK" | "YOUTUBE" | "LINKEDIN";
  label: string;
  oauth?: OAuthPlatform;
  connect?: string;
}[] = [
  { key: "TWITTER", label: "X" },
  { key: "TIKTOK", label: "TikTok", oauth: "tiktok", connect: "/api/marketing/connect/tiktok" },
  { key: "YOUTUBE", label: "YouTube", oauth: "youtube", connect: "/api/marketing/connect/youtube" },
  { key: "LINKEDIN", label: "LinkedIn", oauth: "linkedin", connect: "/api/marketing/connect/linkedin" },
];

export default function PlatformStatusBar({ compact = false }: { compact?: boolean }) {
  const { data: session } = useSession();
  const canConnect = canConnectMarketingAccounts(session);
  const isAdmin = session?.user?.role === "ADMIN";
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    for (const p of ["tiktok", "linkedin", "youtube"] as const) {
      if (searchParams.get(p) === "ok") {
        setFlash(`${p} conectado`);
        return;
      }
      if (searchParams.get(p) === "error") {
        const msg = searchParams.get("msg");
        setFlash(msg ? `Error ${p}: ${msg}` : `Error al conectar ${p}`);
        return;
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const q = isAdmin ? "?verify=1" : "";
    fetch(`/api/marketing/status${q}`)
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [isAdmin]);

  if (!status) return null;

  return (
    <div className={`platform-status-bar${compact ? " platform-status-bar--compact" : ""}`}>
      {flash && <p className="alert alert-info platform-status-flash">{flash}</p>}
      <div className="platform-status-chips">
        {ITEMS.map((item) => {
          let state: "ok" | "warn" | "off" = "off";
          let hint: string | null = null;

          if (item.key === "TWITTER") {
            const tw = status.twitter;
            const configured = tw.configured ?? !tw.missing?.length;
            if (!configured) {
              state = "off";
              hint = tw.missing?.length ? `Vercel: ${tw.missing.join(", ")}` : "Variables en Vercel";
            } else if (tw.ready && !tw.error) {
              state = "ok";
              hint = tw.username ? `@${tw.username}` : "Credenciales OK";
            } else {
              state = "warn";
              hint = tw.error || "Verificación pendiente";
            }
          } else if (item.oauth) {
            const p = status[item.oauth];
            if (!p.appConfigured) {
              state = "off";
              hint = "Variables en Vercel";
            } else if (p.connected) {
              state = "ok";
            } else {
              state = "warn";
              hint = "Autorizar una vez";
            }
          }

          const showConnect =
            item.oauth &&
            canConnect &&
            state === "warn" &&
            item.connect &&
            status[item.oauth]?.appConfigured;

          return (
            <div key={item.key} className={`platform-chip platform-chip--${state}`}>
              <span className="platform-chip-label">{item.label}</span>
              <span className="platform-chip-state">
                {state === "ok" ? "Listo" : state === "warn" ? "Pendiente" : "Off"}
              </span>
              {hint && !compact && (
                <span className="platform-chip-hint" title={hint}>
                  {hint.length > 48 ? `${hint.slice(0, 45)}…` : hint}
                </span>
              )}
              {showConnect && (
                <a href={item.connect} className="platform-chip-link">
                  Conectar
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
