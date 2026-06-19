// app/api/marketing/analytics/route.ts
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import authOptions from "@/app/api/auth/[...nextauth]/auth-options";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MARKETING") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const campaignId = searchParams.get("campaignId");

    // Build where clause
    const where: any = { status: "PUBLISHED" };
    if (platform) where.platform = platform;
    if (campaignId) where.campaignId = campaignId;

    const posts = await prisma.socialPost.findMany({
      where,
    });

    // Calculate aggregate metrics
    const metrics = {
      totalImpressions: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      avgEngagementRate: 0,
      postsCount: posts.length,
      byPlatform: {} as Record<string, any>,
    };

    posts.forEach((post) => {
      metrics.totalImpressions += post.impressions;
      metrics.totalLikes += post.likes;
      metrics.totalComments += post.comments;
      metrics.totalShares += post.shares;

      if (!metrics.byPlatform[post.platform]) {
        metrics.byPlatform[post.platform] = {
          count: 0,
          impressions: 0,
          likes: 0,
          engagement: 0,
        };
      }

      metrics.byPlatform[post.platform].count += 1;
      metrics.byPlatform[post.platform].impressions += post.impressions;
      metrics.byPlatform[post.platform].likes += post.likes;
    });

    // Calculate engagement rates
    if (metrics.totalImpressions > 0) {
      metrics.avgEngagementRate =
        ((metrics.totalLikes +
          metrics.totalComments +
          metrics.totalShares) /
          metrics.totalImpressions) *
        100;
    }

    // Per-platform engagement
    Object.keys(metrics.byPlatform).forEach((platform) => {
      const platformData = metrics.byPlatform[platform];
      if (platformData.impressions > 0) {
        platformData.engagement =
          (platformData.likes / platformData.impressions) * 100;
      }
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
