import { NextResponse } from "next/server";
import { verifyIngestSecret, recordBooking } from "@/lib/ingest";

export async function POST(req) {
  if (!verifyIngestSecret(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const date = String(body.date || "").trim();
    const time = String(body.time || "").trim();

    if (!name || !email || !date || !time) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const contact = await recordBooking({
      name,
      email,
      phone: body.phone || null,
      company: body.company || null,
      date,
      time,
      meetUrl: body.meetUrl || null,
      notes: body.notes || null,
      interest: body.interest || null,
    });

    return NextResponse.json({ ok: true, contactId: contact.id });
  } catch (err) {
    console.error("ingest/booking:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
