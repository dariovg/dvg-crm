import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QuotePdfView from "@/components/QuotePdfView";
import PublicQuoteToolbar from "@/components/PublicQuoteToolbar";
import { recordQuotePdfOpen, getQuoteByShareToken } from "@/lib/quote-tracking";
import { rateLimitRequest } from "@/lib/rate-limit";

export const metadata = {
  title: "Presupuesto · DVG Studio",
  robots: { index: false, follow: false },
};

export default async function PublicQuotePage({ params }) {
  const { token } = await params;
  const hdrs = await headers();
  const { ok } = rateLimitRequest(hdrs, "quote-public", {
    limit: 60,
    windowMs: 60_000,
  });
  if (!ok) notFound();

  await recordQuotePdfOpen(token);

  const quote = await getQuoteByShareToken(token);
  if (!quote) notFound();

  const canSign = quote.status === "SENT" && !quote.signedAt;
  const publicQuote = { ...quote, notes: null };

  return (
    <div className="quote-public-page">
      <PublicQuoteToolbar token={token} canSign={canSign} />
      <QuotePdfView
        quote={publicQuote}
        showSignature
        trackingPixel={`/api/quote-track/${token}`}
      />
    </div>
  );
}
