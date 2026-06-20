import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { syncAllPublishedMetrics } from "@/lib/social/metrics.js";

/** Sincroniza métricas reales desde X y TikTok. */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "MARKETING") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = await syncAllPublishedMetrics({ days: 60, limit: 50 });
    return NextResponse.json({ ok: true, ...payload });
  } catch (error) {
    console.error("marketing/metrics/sync:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
