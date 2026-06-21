import { NextResponse } from "next/server";
import {
  getTwitterConfigDiagnostics,
  verifyTwitterCredentials,
} from "@/lib/social/twitter.js";

export const dynamic = "force-dynamic";

/** Diagnóstico X (solo flags, sin secretos). Público para verificar deploy/env. */
export async function GET(request) {
  const d = getTwitterConfigDiagnostics();
  const verify = new URL(request.url).searchParams.get("verify") === "1";

  if (!d.ready) {
    return NextResponse.json({
      ok: false,
      configured: false,
      missing: d.missing,
      hint: "Añade las variables que faltan en Vercel y redeploy",
    });
  }

  if (!verify) {
    return NextResponse.json({
      ok: true,
      configured: true,
      missing: [],
      hint: "Variables presentes. Añade ?verify=1 para probar credenciales con X API",
    });
  }

  const check = await verifyTwitterCredentials();
  return NextResponse.json({
    ok: check.ready,
    configured: true,
    missing: check.missing || [],
    username: check.username || null,
    error: check.error || null,
    hint: check.ready
      ? "Credenciales válidas — X puede publicar"
      : "Variables OK pero X API rechazó las credenciales",
  });
}
