import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APP_VERSION } from "@/lib/version";

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

  const ok = database === "up";

  return NextResponse.json(
    {
      ok,
      version: APP_VERSION,
      database,
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
