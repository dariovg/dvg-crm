import { NextResponse } from "next/server";
import { getTwitterConfigDiagnostics } from "@/lib/social/twitter.js";

export const dynamic = "force-dynamic";

/** Diagnóstico X (solo flags, sin secretos). Público para verificar deploy/env. */
export async function GET() {
  const d = getTwitterConfigDiagnostics();
  return NextResponse.json({
    ok: d.ready,
    missing: d.missing,
    hint: d.ready
      ? "X listo en este deploy"
      : "Añade las variables que faltan en Vercel y redeploy",
  });
}
