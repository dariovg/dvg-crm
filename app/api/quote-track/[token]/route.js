import { recordQuotePdfOpen } from "@/lib/quote-tracking";

/** Pixel 1×1 para seguimiento en clientes de correo (img src). */
export async function GET(_req, { params }) {
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
