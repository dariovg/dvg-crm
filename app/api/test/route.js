export async function GET() {
  return Response.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "MISSING",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "SET" : "MISSING",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "SET" : "MISSING",
    CRM_ALLOWED_EMAILS: process.env.CRM_ALLOWED_EMAILS || "MISSING",
    NODE_ENV: process.env.NODE_ENV,
  });
}
