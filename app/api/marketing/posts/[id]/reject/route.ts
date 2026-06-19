// app/api/marketing/posts/[id]/reject/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can reject
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin role required' }, { status: 403 });
    }

    const postId = params.id;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Find the post
    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot reject post with status: ${post.status}` },
        { status: 400 }
      );
    }

    // Update post status
    const updatedPost = await prisma.socialPost.update({
      where: { id: postId },
      data: {
        status: 'REJECTED',
      },
      include: {
        createdBy: true,
        approvals: {
          include: { approvedBy: true },
        },
      },
    });

    // Create approval log with rejection reason
    await prisma.approvalLog.create({
      data: {
        postId,
        status: 'REJECTED',
        approvedById: session.user.id,
        notes: reason,
      },
    });

    // TODO: Trigger notification to user who created the post with rejection reason

    return NextResponse.json(
      {
        message: 'Post rejected',
        post: updatedPost,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error rejecting post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
