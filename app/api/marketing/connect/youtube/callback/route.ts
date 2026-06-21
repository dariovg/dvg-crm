import { NextRequest, NextResponse } from "next/server";
import { exchangeYouTubeCode } from "@/lib/social/youtube-connection.js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "";

  if (error) {
    return NextResponse.redirect(
      `${base}/marketing/conexiones?youtube=error&msg=${encodeURIComponent(error)}`
    );
  }

  const savedState = request.cookies.get("youtube_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(
      `${base}/marketing/conexiones?youtube=error&msg=state_invalido`
    );
  }

  try {
    await exchangeYouTubeCode(code);
    const res = NextResponse.redirect(
      `${base}/marketing/conexiones?youtube=ok`
    );
    res.cookies.delete("youtube_oauth_state");
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "oauth_failed";
    return NextResponse.redirect(
      `${base}/marketing/conexiones?youtube=error&msg=${encodeURIComponent(msg)}`
    );
  }
}
