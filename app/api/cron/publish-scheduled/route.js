import { NextResponse } from "next/server";
import { publishDueScheduledPosts } from "@/lib/social/publish.js";

/** Vercel Cron: publica posts programados cuya hora ya llegó. */
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
    const results = await publishDueScheduledPosts();
    return NextResponse.json({ ok: true, published: results.length, results });
  } catch (err) {
    console.error("cron/publish-scheduled:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
