export async function GET() {
  const allowedEmails = (process.env.CRM_ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());

  return Response.json({
    CRM_ALLOWED_EMAILS_RAW: process.env.CRM_ALLOWED_EMAILS || "NOT SET",
    CRM_ALLOWED_EMAILS_PARSED: allowedEmails,
    isInfoAllowed: allowedEmails.includes("info@dvgsstudio.com"),
  });
}
