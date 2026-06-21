import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import {
  buildYouTubeAuthorizeUrl,
  isYouTubeAppConfigured,
} from "@/lib/social/youtube-connection.js";
import crypto from "crypto";

/** Inicia OAuth YouTube (solo ADMIN). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isYouTubeAppConfigured()) {
    return NextResponse.json(
      {
        error:
          "Faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el servidor.",
      },
      { status: 503 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const url = buildYouTubeAuthorizeUrl({ state });

  const res = NextResponse.redirect(url);
  res.cookies.set("youtube_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return res;
}
