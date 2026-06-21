import { NextResponse } from "next/server";
import { alertStalePendingPosts } from "@/lib/social/alerts.js";
import { sendWeeklyReportIfDue } from "@/lib/weekly-report.js";
import { sendCalendarEventReminders } from "@/lib/team-calendar.js";
import { rateLimitResponse } from "@/lib/rate-limit";

/** Cron: alertas marketing + informe semanal (Hobby: un solo slot diario). */
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
    const alerts = await alertStalePendingPosts();
    let weeklyReport = null;
    let calendarReminders = null;
    try {
      weeklyReport = await sendWeeklyReportIfDue();
    } catch (weeklyErr) {
      console.error("cron weekly-report:", weeklyErr);
    }
    try {
      calendarReminders = await sendCalendarEventReminders();
    } catch (calErr) {
      console.error("cron calendar-reminders:", calErr);
    }
    return NextResponse.json({ ok: true, alerts, weeklyReport, calendarReminders });
  } catch (err) {
    console.error("cron/marketing-alerts:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
