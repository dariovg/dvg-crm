import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuoteEditor from "@/components/QuoteEditor";
import { getAuthSession } from "@/lib/auth-server";
import { canAccessQuote, canEditQuote, isAdmin } from "@/lib/permissions";
import Link from "next/link";

export default async function QuoteDetailPage({ params }) {
  const { id } = await params;
  const session = await getAuthSession();

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      contact: true,
      lines: { orderBy: { sortOrder: "asc" } },
      createdBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!quote || !canAccessQuote(session, quote)) notFound();

  return (
    <>
      <p className="breadcrumb">
        <Link href="/presupuestos">Presupuestos</Link> ·{" "}
        <Link href={`/leads/${quote.contactId}`}>{quote.contact.name}</Link>
      </p>
      <QuoteEditor
        key={`${quote.id}-${quote.updatedAt}`}
        quote={quote}
        isAdmin={isAdmin(session)}
        canEdit={canEditQuote(session, quote)}
      />
    </>
  );
}
