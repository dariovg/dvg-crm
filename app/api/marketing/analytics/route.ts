// app/api/marketing/analytics/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'MARKETING') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const range = searchParams.get('range') || '30days';

    const now = new Date();
    const daysAgo =
      range === '7days' ? 7 : range === '90days' ? 90 : 30;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysAgo);

    const where: Prisma.SocialPostWhereInput = {
      status: 'PUBLISHED',
      publishedAt: {
        gte: startDate,
        lte: now,
      },
    };

    if (platform && platform !== 'ALL') {
      where.platform = platform as Prisma.EnumSocialPlatformFilter['equals'];
    }

    const posts = await prisma.socialPost.findMany({
      where,
    });

    const totalImpressions = posts.reduce((sum, post) => sum + post.impressions, 0);
    const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments, 0);
    const totalShares = posts.reduce((sum, post) => sum + post.shares, 0);

    const totalEngagement = totalLikes + totalComments + totalShares;
    const engagementRate =
      totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;
    const ctr = totalImpressions > 0 ? (totalShares / totalImpressions) * 100 : 0;
    const averageEngagement = posts.length > 0 ? totalEngagement / posts.length : 0;

    const topPost = posts.reduce<(typeof posts)[number] | null>((top, current) => {
      const currentEngagement = current.likes + current.comments + current.shares;
      const topEngagement = top
        ? top.likes + top.comments + top.shares
        : 0;

      return currentEngagement > topEngagement ? current : top;
    }, null);

    const trendsMap: Record<string, { impressions: number; engagement: number }> = {};

    for (let i = 0; i < daysAgo; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trendsMap[dateStr] = { impressions: 0, engagement: 0 };
    }

    posts.forEach((post) => {
      if (post.publishedAt) {
        const dateStr = post.publishedAt.toISOString().split('T')[0];
        if (trendsMap[dateStr]) {
          trendsMap[dateStr].impressions += post.impressions;
          trendsMap[dateStr].engagement +=
            ((post.likes + post.comments + post.shares) /
              Math.max(1, post.impressions)) *
            100;
        }
      }
    });

    const trendsData = Object.entries(trendsMap)
      .map(([date, data]) => ({
        date,
        impressions: data.impressions,
        engagement: data.engagement / Math.max(1, posts.length),
      }))
      .reverse();

    return NextResponse.json({
      platform: platform || 'ALL',
      totalImpressions,
      totalLikes,
      totalComments,
      totalShares,
      engagementRate: parseFloat(engagementRate.toFixed(2)),
      ctr: parseFloat(ctr.toFixed(2)),
      averageEngagement: parseFloat(averageEngagement.toFixed(2)),
      topPost: topPost
        ? {
            id: topPost.id,
            content: topPost.content,
            metrics: {
              likes: topPost.likes,
              comments: topPost.comments,
              shares: topPost.shares,
              impressions: topPost.impressions,
            },
          }
        : null,
      trendsData,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
