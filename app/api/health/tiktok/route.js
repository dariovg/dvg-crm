import { NextResponse } from "next/server";
import { getTikTokConfigDiagnostics, getTikTokClientConfig } from "@/lib/social/tiktok-connection.js";

export const dynamic = "force-dynamic";

/** Diagnóstico TikTok OAuth (sin secretos). */
export async function GET() {
  const d = getTikTokConfigDiagnostics();
  const { clientKey } = getTikTokClientConfig();
  const scope = process.env.TIKTOK_SCOPES?.trim() || "user.info.basic";
  return NextResponse.json({
    ok: d.ready,
    missing: d.missing,
    redirectUri: d.redirectUri,
    scopes: scope,
    clientKeyLength: d.clientKeyLength,
    clientKeyPreview: d.clientKeyPreview,
    checklist: [
      "App en https://developers.tiktok.com (no TikTok Ads/Business API)",
      "Producto Login Kit añadido → Configure for Web → ON",
      `Redirect URI registrado EXACTO: ${d.redirectUri}`,
      "Si la app está en Sandbox: añade tu cuenta TikTok como test user",
      "Tras aprobar Content Posting API: TIKTOK_SCOPES=user.info.basic,video.publish,video.upload",
    ],
    hint: d.ready
      ? "La app usa redirectUri sin barra final. Si en TikTok tienes otra URI fija, pon TIKTOK_REDIRECT_URI en Vercel con ese valor exacto."
      : "Corrige las variables que faltan en Vercel (Production)",
  });
}
