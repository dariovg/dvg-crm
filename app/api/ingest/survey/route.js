import { NextResponse } from "next/server";
import { verifyIngestSecret, recordSurvey } from "@/lib/ingest";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req) {
  const limited = rateLimitResponse(req, "ingest-survey", {
    limit: 60,
    windowMs: 60_000,
  });
  if (limited) return limited;

  if (!verifyIngestSecret(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const contact = await recordSurvey({
      name: body.name || null,
      email: body.email || null,
      answers: body.answers || body,
      score: body.score ?? null,
    });

    return NextResponse.json({ ok: true, contactId: contact?.id || null });
  } catch (err) {
    console.error("ingest/survey:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
