import { NextResponse } from "next/server";
import { publishDueScheduledPosts } from "@/lib/social/publish.js";
import { syncAllPublishedMetrics } from "@/lib/social/metrics.js";
import { rateLimitResponse } from "@/lib/rate-limit";

/** Vercel Cron: publica posts programados y sincroniza métricas. */
export async function GET(req) {
  const limited = rateLimitResponse(req, "cron-publish", {
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
    const results = await publishDueScheduledPosts();
    let metrics = null;
    try {
      const payload = await syncAllPublishedMetrics({ days: 60, limit: 40 });
      metrics = payload.summary;
    } catch (metricsErr) {
      console.error("cron metrics sync:", metricsErr);
    }
    return NextResponse.json({
      ok: true,
      published: results.length,
      results,
      metrics,
    });
  } catch (err) {
    console.error("cron/publish-scheduled:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
