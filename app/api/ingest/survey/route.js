import { NextResponse } from "next/server";
import { verifyIngestSecret, recordSurvey } from "@/lib/ingest";

export async function POST(req) {
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
