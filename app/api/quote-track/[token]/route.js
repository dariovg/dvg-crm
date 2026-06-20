import { NextResponse } from "next/server";
import { recordQuotePdfOpen } from "@/lib/quote-tracking";
import { rateLimitResponse } from "@/lib/rate-limit";

/** Pixel 1×1 para seguimiento en clientes de correo (img src). */
export async function GET(req, { params }) {
  const limited = rateLimitResponse(req, "quote-track", {
    limit: 120,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const { token } = await params;
  await recordQuotePdfOpen(token);

  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new Response(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
