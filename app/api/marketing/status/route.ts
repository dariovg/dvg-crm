import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { isMarketingAuthorized } from "@/lib/marketing-auth";
import { isTwitterConfigured } from "@/lib/social/twitter.js";
import { listConfiguredPlatforms } from "@/lib/social/publish.js";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isMarketingAuthorized(session)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json({
    twitter: isTwitterConfigured(),
    configuredPlatforms: listConfiguredPlatforms(),
  });
}
