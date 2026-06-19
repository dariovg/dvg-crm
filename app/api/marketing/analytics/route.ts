// app/api/marketing/analytics/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

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

    // Calculate date range
    const now = new Date();
    const daysAgo =
      range === '7days' ? 7 : range === '90days' ? 90 : 30;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysAgo);

    // Build filter
    const where: any = {
      status: 'PUBLISHED',
      publishedAt: {
        gte: startDate,
        lte: now,
      },
    };

    if (platform && platform !== 'ALL') {
      where.platform = platform;
    }

    // Get all published posts in date range
    const posts = await prisma.socialPost.findMany({
      where,
      include: {
        metrics: true,
      },
    });

    // Calculate aggregated metrics
    const totalImpressions = posts.reduce(
      (sum, post) => sum + (post.metrics?.impressions || 0),
      0
    );
    const totalLikes = posts.reduce(
      (sum, post) => sum + (post.metrics?.likes || 0),
      0
    );
    const totalComments = posts.reduce(
      (sum, post) => sum + (post.metrics?.comments || 0),
      0
    );
    const totalShares = posts.reduce(
      (sum, post) => sum + (post.metrics?.shares || 0),
      0
    );

    const totalEngagement = totalLikes + totalComments + totalShares;
    const engagementRate =
      totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;
    const ctr = totalImpressions > 0 ? (totalShares / totalImpressions) * 100 : 0;
    const averageEngagement = posts.length > 0 ? totalEngagement / posts.length : 0;

    // Find top post
    const topPost = posts.reduce((top, current) => {
      const currentEngagement =
        (current.metrics?.likes || 0) +
        (current.metrics?.comments || 0) +
        (current.metrics?.shares || 0);
      const topEngagement =
        (top?.metrics?.likes || 0) +
        (top?.metrics?.comments || 0) +
        (top?.metrics?.shares || 0);

      return currentEngagement > topEngagement ? current : top;
    });

    // Generate trends data
    const trendsMap: { [key: string]: { impressions: number; engagement: number } } = {};
    
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
          trendsMap[dateStr].impressions += post.metrics?.impressions || 0;
          trendsMap[dateStr].engagement +=
            ((post.metrics?.likes || 0) +
              (post.metrics?.comments || 0) +
              (post.metrics?.shares || 0)) /
            Math.max(1, post.metrics?.impressions || 1) * 100;
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
            title: topPost.title,
            content: topPost.content,
            metrics: {
              likes: topPost.metrics?.likes || 0,
              comments: topPost.metrics?.comments || 0,
              shares: topPost.metrics?.shares || 0,
              impressions: topPost.metrics?.impressions || 0,
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
