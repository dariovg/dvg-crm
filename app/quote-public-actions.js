"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getQuoteByShareToken, recordQuotePdfOpen } from "@/lib/quote-tracking";
import { rateLimitRequest } from "@/lib/rate-limit";

async function assertPublicRateLimit(scope) {
  const hdrs = await headers();
  const { ok } = rateLimitRequest(hdrs, scope, { limit: 30, windowMs: 60_000 });
  if (!ok) throw new Error("Demasiadas solicitudes. Inténtalo más tarde.");
}

export async function trackQuoteOpen(shareToken) {
  await assertPublicRateLimit("quote-open");
  return recordQuotePdfOpen(shareToken);
}

export async function signQuoteByToken(shareToken, { mode, dataUrl, signedByName }) {
  await assertPublicRateLimit("quote-sign");
  const quote = await getQuoteByShareToken(shareToken);
  if (!quote) throw new Error("Enlace no válido o expirado");
  if (quote.status !== "SENT") {
    throw new Error("Este presupuesto no está pendiente de firma");
  }
  if (quote.signedAt) throw new Error("Ya fue firmado");

  let signature = null;
  let name = signedByName?.trim() || quote.contact.name;

  if (mode === "draw") {
    if (!dataUrl?.startsWith("data:image")) {
      throw new Error("Firma no válida");
    }
    signature = dataUrl;
  } else if (mode === "typed") {
    if (!signedByName || signedByName.trim().length < 2) {
      throw new Error("Indica tu nombre completo");
    }
    name = signedByName.trim();
    signature = `typed:${name}`;
  } else {
    throw new Error("Modo de firma no válido");
  }

  const now = new Date();

  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: "ACCEPTED",
      clientSignature: signature,
      signedAt: now,
      signedByName: name,
    },
  });

  await prisma.contactEvent.create({
    data: {
      contactId: quote.contactId,
      type: "quote_accepted",
      summary: `Presupuesto ${quote.number} firmado por ${name}`,
    },
  });

  revalidatePath(`/presupuestos/${quote.id}`);
  revalidatePath(`/p/${shareToken}`);
  return { ok: true };
}
