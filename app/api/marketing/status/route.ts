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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isMarketingAuthorized(session)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const conn = await getTikTokConnection();
  const { redirectUri } = getTikTokClientConfig();

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
    configuredPlatforms: await listConfiguredPlatforms(),
  });
}
