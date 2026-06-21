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

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isMarketingAuthorized(session)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const conn = await getTikTokConnection();
  const { redirectUri } = getTikTokClientConfig();
  const linkedInConn = await getLinkedInConnection();
  const { redirectUri: linkedInRedirectUri } = getLinkedInClientConfig();
  const youtubeConn = await getYouTubeConnection();
  const { redirectUri: youtubeRedirectUri } = getYouTubeClientConfig();

  const twitterDiag = getTwitterConfigDiagnostics();
  let twitter = {
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
      ready: check.ready,
      missing: check.missing || [],
      username: check.username || null,
      error: check.error || null,
    };
  }

  return NextResponse.json({
    twitter,
    tiktok: {
      appConfigured: isTikTokAppConfigured(),
      connected: await isTikTokConnected(),
      openId: conn?.openId ?? null,
      scope: conn?.scope ?? null,
      expiresAt: conn?.expiresAt?.toISOString() ?? null,
      redirectUri,
    },
    linkedin: {
      appConfigured: isLinkedInAppConfigured(),
      connected: await isLinkedInConnected(),
      openId: linkedInConn?.openId ?? null,
      scope: linkedInConn?.scope ?? null,
      expiresAt: linkedInConn?.expiresAt?.toISOString() ?? null,
      redirectUri: linkedInRedirectUri,
      organizationUrn: getLinkedInOrganizationUrn(),
    },
    youtube: {
      appConfigured: isYouTubeAppConfigured(),
      connected: await isYouTubeConnected(),
      channelId: youtubeConn?.openId ?? null,
      scope: youtubeConn?.scope ?? null,
      expiresAt: youtubeConn?.expiresAt?.toISOString() ?? null,
      redirectUri: youtubeRedirectUri,
    },
    configuredPlatforms: await listConfiguredPlatforms(),
  });
}
