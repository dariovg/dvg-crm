import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import {
  buildTikTokAuthorizeUrl,
  generatePkcePair,
  getTikTokClientConfig,
  isTikTokAppConfigured,
} from "@/lib/social/tiktok-connection.js";
import crypto from "crypto";

/** Inicia OAuth TikTok (solo ADMIN). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isTikTokAppConfigured()) {
    return NextResponse.json(
      {
        error:
          "Faltan TIKTOK_CLIENT_KEY y TIKTOK_CLIENT_SECRET en el servidor.",
      },
      { status: 503 }
    );
  }

  const { redirectUri } = getTikTokClientConfig();
  const state = crypto.randomBytes(16).toString("hex");
  const { verifier, challenge } = generatePkcePair();

  const url = buildTikTokAuthorizeUrl({ state, codeChallenge: challenge });

  const res = NextResponse.redirect(url);
  res.cookies.set("tiktok_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  res.cookies.set("tiktok_pkce_verifier", verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return res;
}
