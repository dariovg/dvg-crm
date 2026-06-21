import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { isMarketingAuthorized } from "@/lib/marketing-auth";
import { isTwitterConfigured } from "@/lib/social/twitter.js";
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

export async function GET() {
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

  return NextResponse.json({
    twitter: isTwitterConfigured(),
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
