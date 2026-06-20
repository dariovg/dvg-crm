import { NextResponse } from "next/server";
import { alertStalePendingPosts } from "@/lib/social/alerts.js";
import { rateLimitResponse } from "@/lib/rate-limit";

/** Cron: alerta Slack/email si hay posts pendientes de aprobación >24h. */
export async function GET(req) {
  const limited = rateLimitResponse(req, "cron-marketing-alerts", {
    limit: 10,
    windowMs: 60_000,
  });
  if (limited) return limited;

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
    const result = await alertStalePendingPosts();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("cron/marketing-alerts:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
