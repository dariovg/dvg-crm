import { prisma } from "@/lib/prisma";

/** Registra apertura del PDF/vista pública (idempotente por visita). */
export async function recordQuotePdfOpen(shareToken) {
  const quote = await prisma.quote.findUnique({
    where: { shareToken },
    select: {
      id: true,
      contactId: true,
      number: true,
      pdfFirstOpenedAt: true,
      pdfOpenCount: true,
    },
  });
  if (!quote) return null;

  const now = new Date();
  const isFirst = !quote.pdfFirstOpenedAt;

  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      pdfOpenCount: { increment: 1 },
      pdfFirstOpenedAt: quote.pdfFirstOpenedAt ?? now,
      pdfLastOpenedAt: now,
    },
  });

  if (isFirst) {
    await prisma.contactEvent.create({
      data: {
        contactId: quote.contactId,
        type: "quote_pdf_opened",
        summary: `Cliente abrió presupuesto ${quote.number}`,
      },
    });
  }

  return { quoteId: quote.id, isFirst };
}

export async function getQuoteByShareToken(shareToken) {
  return prisma.quote.findUnique({
    where: { shareToken },
    include: {
      contact: true,
      lines: { orderBy: { sortOrder: "asc" } },
    },
  });
}
