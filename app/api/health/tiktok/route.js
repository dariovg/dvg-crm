import { NextResponse } from "next/server";
import { getTikTokConfigDiagnostics } from "@/lib/social/tiktok-connection.js";

export const dynamic = "force-dynamic";

/** Diagnóstico TikTok OAuth (sin secretos). */
export async function GET() {
  const d = getTikTokConfigDiagnostics();
  return NextResponse.json({
    ok: d.ready,
    missing: d.missing,
    redirectUri: d.redirectUri,
    clientKeyLength: d.clientKeyLength,
    clientKeyPreview: d.clientKeyPreview,
    hint: d.ready
      ? "Registra redirectUri en TikTok for Developers → Login Kit → Redirect URI"
      : "Corrige las variables que faltan en Vercel (Production)",
    portalRedirectUri: d.redirectUri,
  });
}
