import { NextRequest, NextResponse } from "next/server";
import { exchangeLinkedInCode } from "@/lib/social/linkedin-connection.js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "";

  if (error) {
    const msg = errorDescription || error;
    return NextResponse.redirect(
      `${base}/marketing/conexiones?linkedin=error&msg=${encodeURIComponent(msg)}`
    );
  }

  const savedState = request.cookies.get("linkedin_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(
      `${base}/marketing/conexiones?linkedin=error&msg=state_invalido`
    );
  }

  try {
    await exchangeLinkedInCode(code);
    const res = NextResponse.redirect(
      `${base}/marketing/conexiones?linkedin=ok`
    );
    res.cookies.delete("linkedin_oauth_state");
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "oauth_failed";
    return NextResponse.redirect(
      `${base}/marketing/conexiones?linkedin=error&msg=${encodeURIComponent(msg)}`
    );
  }
}
