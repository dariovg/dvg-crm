import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APP_VERSION } from "@/lib/version";
import { getTwitterConfigDiagnostics } from "@/lib/social/twitter.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Uptime / load-balancer probe: DB ping + versión desplegada. */
export async function GET() {
  const timestamp = new Date().toISOString();
  let database = "up";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error("health/db:", err);
    database = "down";
  }

  const x = getTwitterConfigDiagnostics();
  const ok = database === "up";

  return NextResponse.json(
    {
      ok,
      version: APP_VERSION,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
      database,
      x: { ready: x.ready, missing: x.missing },
      timestamp,
      service: "dvg-crm",
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
