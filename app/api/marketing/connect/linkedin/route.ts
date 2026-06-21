import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import {
  buildLinkedInAuthorizeUrl,
  isLinkedInAppConfigured,
} from "@/lib/social/linkedin-connection.js";
import crypto from "crypto";

/** Inicia OAuth LinkedIn (solo ADMIN). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isLinkedInAppConfigured()) {
    return NextResponse.json(
      {
        error:
          "Faltan LINKEDIN_CLIENT_ID y LINKEDIN_CLIENT_SECRET en el servidor.",
      },
      { status: 503 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const url = buildLinkedInAuthorizeUrl({ state });

  const res = NextResponse.redirect(url);
  res.cookies.set("linkedin_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return res;
}
