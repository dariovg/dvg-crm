import { NextResponse } from "next/server";
import { syncAllPublishedMetrics } from "@/lib/social/metrics.js";

/** Cron: sincroniza métricas de posts publicados desde X/TikTok. */
export async function GET(req) {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      return NextResponse.json({ error: "Cron no configurado" }, { status: 503 });
    }
  } else if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const payload = await syncAllPublishedMetrics({ days: 90, limit: 60 });
    return NextResponse.json({ ok: true, ...payload });
  } catch (err) {
    console.error("cron/sync-metrics:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
