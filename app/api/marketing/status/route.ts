import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { isMarketingAuthorized } from "@/lib/marketing-auth";
import { getTwitterConfigDiagnostics, verifyTwitterCredentials } from "@/lib/social/twitter.js";
import { listConfiguredPlatforms } from "@/lib/social/publish.js";
import {
  getTikTokClientConfig,
  getTikTokConnection,
  isTikTokAppConfigured,
  isTikTokConnected,
} from "@/lib/social/tiktok-connection.js";
import {
  getLinkedInClientConfig,
  getLinkedInConnection,
  getLinkedInOrganizationUrn,
  isLinkedInAppConfigured,
  isLinkedInConnected,
} from "@/lib/social/linkedin-connection.js";
import {
  getYouTubeClientConfig,
  getYouTubeConnection,
  isYouTubeAppConfigured,
  isYouTubeConnected,
} from "@/lib/social/youtube-connection.js";

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`marketing/status ${label}:`, err);
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isMarketingAuthorized(session)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const twitterDiag = getTwitterConfigDiagnostics();
  let twitter = {
    configured: twitterDiag.ready,
    ready: twitterDiag.ready,
    missing: twitterDiag.missing,
    username: null as string | null,
    error: null as string | null,
  };

  if (
    session.user.role === "ADMIN" &&
    twitterDiag.ready &&
    request.nextUrl.searchParams.get("verify") === "1"
  ) {
    const check = await verifyTwitterCredentials();
    twitter = {
      configured: true,
      ready: check.ready,
      missing: check.missing || [],
      username: check.username || null,
      error: check.error || null,
    };
  }

  const conn = await safe("tiktok", () => getTikTokConnection(), null);
  const { redirectUri } = getTikTokClientConfig();
  const linkedInConn = await safe("linkedin", () => getLinkedInConnection(), null);
  const { redirectUri: linkedInRedirectUri } = getLinkedInClientConfig();
  const youtubeConn = await safe("youtube", () => getYouTubeConnection(), null);
  const { redirectUri: youtubeRedirectUri } = getYouTubeClientConfig();

  return NextResponse.json({
    twitter,
    tiktok: {
      appConfigured: isTikTokAppConfigured(),
      connected: await safe("tiktok-connected", () => isTikTokConnected(), false),
      needsOAuth: isTikTokAppConfigured(),
      hint: isTikTokAppConfigured()
        ? "API keys OK — pulsa Conectar para autorizar tu cuenta TikTok (una vez)"
        : "Faltan TIKTOK_CLIENT_KEY y TIKTOK_CLIENT_SECRET en Vercel",
      openId: conn?.openId ?? null,
      scope: conn?.scope ?? null,
      expiresAt: conn?.expiresAt?.toISOString() ?? null,
      redirectUri,
    },
    linkedin: {
      appConfigured: isLinkedInAppConfigured(),
      connected: await safe("linkedin-connected", () => isLinkedInConnected(), false),
      hint: isLinkedInAppConfigured()
        ? "API OK — pulsa Conectar para autorizar LinkedIn (una vez)"
        : "Faltan LINKEDIN_CLIENT_ID y LINKEDIN_CLIENT_SECRET en Vercel",
      openId: linkedInConn?.openId ?? null,
      scope: linkedInConn?.scope ?? null,
      expiresAt: linkedInConn?.expiresAt?.toISOString() ?? null,
      redirectUri: linkedInRedirectUri,
      organizationUrn: getLinkedInOrganizationUrn(),
    },
    youtube: {
      appConfigured: isYouTubeAppConfigured(),
      connected: await safe("youtube-connected", () => isYouTubeConnected(), false),
      needsOAuth: isYouTubeAppConfigured(),
      hint: isYouTubeAppConfigured()
        ? "Google API OK — pulsa Conectar para autorizar tu canal YouTube (una vez)"
        : "Faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en Vercel",
      channelId: youtubeConn?.openId ?? null,
      scope: youtubeConn?.scope ?? null,
      expiresAt: youtubeConn?.expiresAt?.toISOString() ?? null,
      redirectUri: youtubeRedirectUri,
    },
    configuredPlatforms: await safe("platforms", () => listConfiguredPlatforms(), []),
  });
}
