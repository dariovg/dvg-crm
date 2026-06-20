import { NextResponse } from "next/server";
import { verifyIngestSecret, cancelBookingRecord, cleanPhone } from "@/lib/ingest";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req) {
  const limited = rateLimitResponse(req, "ingest-booking-cancel", {
    limit: 60,
    windowMs: 60_000,
  });
  if (limited) return limited;

  if (!verifyIngestSecret(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const date = String(body.date || "").trim();
    const time = String(body.time || "").trim();
    const phone = cleanPhone(body.phone);

    if (!email || !date || !time) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const result = await cancelBookingRecord({ email, phone, date, time });
    if (!result.ok) {
      return NextResponse.json({ error: result.error || "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, contactId: result.contactId });
  } catch (err) {
    console.error("ingest/booking/cancel:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
