import { NextRequest, NextResponse } from "next/server";
import { exchangeTikTokCode } from "@/lib/social/tiktok-connection.js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "";

  if (error) {
    return NextResponse.redirect(
      `${base}/marketing?tiktok=error&msg=${encodeURIComponent(error)}`
    );
  }

  const savedState = request.cookies.get("tiktok_oauth_state")?.value;
  const verifier = request.cookies.get("tiktok_pkce_verifier")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(
      `${base}/marketing?tiktok=error&msg=state_invalido`
    );
  }

  try {
    await exchangeTikTokCode(code, verifier || undefined);
    const res = NextResponse.redirect(
      `${base}/marketing?tiktok=ok`
    );
    res.cookies.delete("tiktok_oauth_state");
    res.cookies.delete("tiktok_pkce_verifier");
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "oauth_failed";
    return NextResponse.redirect(
      `${base}/marketing?tiktok=error&msg=${encodeURIComponent(msg)}`
    );
  }
}
