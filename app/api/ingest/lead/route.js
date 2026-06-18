import { NextResponse } from "next/server";
import { verifyIngestSecret, upsertContactFromLead, cleanPhone } from "@/lib/ingest";

export async function POST(req) {
  if (!verifyIngestSecret(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    if (!name || name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const contact = await upsertContactFromLead({
      name,
      email,
      company: body.company || null,
      phone: body.phone ? cleanPhone(body.phone) : null,
      interest: body.interest || "pricing",
      source: "WEB_CHAT",
      eventType: body.emailed ? "guide_sent" : "lead_created",
      eventSummary: body.emailed
        ? "Guía de planes enviada por email"
        : "Solicitud de guía desde la web",
      payload: body,
    });

    return NextResponse.json({ ok: true, contactId: contact.id });
  } catch (err) {
    console.error("ingest/lead:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
