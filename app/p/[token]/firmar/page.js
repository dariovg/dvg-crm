import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QuoteSignForm from "@/components/QuoteSignForm";
import { getQuoteByShareToken } from "@/lib/quote-tracking";
import { rateLimitRequest } from "@/lib/rate-limit";
import Link from "next/link";

export const metadata = {
  title: "Firmar presupuesto · DVG Studio",
  robots: { index: false, follow: false },
};

export default async function PublicQuoteSignPage({ params }) {
  const { token } = await params;
  const hdrs = await headers();
  const { ok } = rateLimitRequest(hdrs, "quote-sign-page", {
    limit: 30,
    windowMs: 60_000,
  });
  if (!ok) notFound();

  const quote = await getQuoteByShareToken(token);
  if (!quote) notFound();

  if (quote.signedAt || quote.status === "ACCEPTED") {
    return (
      <div className="quote-public-page">
        <div className="quote-public-card quote-public-success">
          <h2>Presupuesto ya firmado</h2>
          <p>
            El presupuesto <strong>{quote.number}</strong> ya fue aceptado.
          </p>
          <Link href={`/p/${token}`} className="btn-secondary">
            Ver presupuesto
          </Link>
        </div>
      </div>
    );
  }

  if (quote.status !== "SENT") {
    return (
      <div className="quote-public-page">
        <div className="quote-public-card">
          <h2>No disponible</h2>
          <p>Este presupuesto aún no está listo para firmar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quote-public-page">
      <QuoteSignForm
        token={token}
        quoteNumber={quote.number}
        contactName={quote.contact.name}
      />
      <p className="quote-public-back">
        <Link href={`/p/${token}`}>← Ver presupuesto completo</Link>
      </p>
    </div>
  );
}
