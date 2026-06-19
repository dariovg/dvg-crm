// app/api/marketing/posts/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

// GET - Fetch posts with filtering
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
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build filter
    const where: any = {};
    if (status) where.status = status;
    if (platform) where.platform = platform;

    const posts = await prisma.socialPost.findMany({
      where,
      include: {
        createdBy: true,
        campaign: true,
        approvals: {
          include: { approvedBy: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });

    const total = await prisma.socialPost.count({ where });

    return NextResponse.json({
      posts,
      total,
      limit,
      skip,
    });
  } catch (error) {
    console.error('Error fetching social posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MARKETING' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Marketing role required' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, platforms, campaignId, imageUrl, scheduledAt } = body;

    // Validation
    if (!title || !content || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Content too long (max 500 characters)' },
        { status: 400 }
      );
    }

    // Create post for each platform
    const createdPosts = await Promise.all(
      platforms.map((platform: string) =>
        prisma.socialPost.create({
          data: {
            title,
            content,
            platform,
            status: 'PENDING',
            imageUrl,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            createdById: session.user.id,
            campaignId,
          },
          include: {
            createdBy: true,
            campaign: true,
          },
        })
      )
    );

    // Create approval task if MARKETING approval is required
    if (session.user.role === 'MARKETING') {
      for (const post of createdPosts) {
        await prisma.approvalLog.create({
          data: {
            postId: post.id,
            status: 'PENDING',
            requestedBy: session.user.id,
          },
        });
      }
    }

    return NextResponse.json(
      {
        message: 'Posts created successfully',
        posts: createdPosts,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating social post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
