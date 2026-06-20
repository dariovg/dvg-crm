import { NextResponse } from "next/server";
import { sendWeeklyReportIfDue } from "@/lib/weekly-report.js";
import { rateLimitResponse } from "@/lib/rate-limit";

/** Cron: informe semanal por email a admins (lunes, 1× por semana). Corre diario en Hobby. */
export async function GET(req) {
  const limited = rateLimitResponse(req, "cron-weekly-report", {
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
    const result = await sendWeeklyReportIfDue();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("cron/weekly-report:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
