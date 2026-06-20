import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuotePdfView from "@/components/QuotePdfView";
import QuotePdfActions from "@/components/QuotePdfActions";
import { getAuthSession } from "@/lib/auth-server";
import { canAccessQuote } from "@/lib/permissions";

export default async function QuotePdfPage({ params }) {
  const { id } = await params;
  const session = await getAuthSession();

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      contact: true,
      lines: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!quote || !canAccessQuote(session, quote)) notFound();

  return (
    <>
      <QuotePdfActions quoteId={quote.id} quote={quote} />
      <QuotePdfView quote={quote} />
    </>
  );
}
