// app/api/marketing/posts/[id]/approve/route.ts
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

    // Only ADMIN can approve
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin role required' }, { status: 403 });
    }

    const postId = params.id;

    // Find the post
    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
      include: {
        approvals: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot approve post with status: ${post.status}` },
        { status: 400 }
      );
    }

    // Update post status
    const updatedPost = await prisma.socialPost.update({
      where: { id: postId },
      data: {
        status: 'APPROVED',
      },
      include: {
        createdBy: true,
        approvals: {
          include: { approvedBy: true },
        },
      },
    });

    // Create approval log
    await prisma.approvalLog.create({
      data: {
        postId,
        status: 'APPROVED',
        approvedById: session.user.id,
        notes: 'Post approved and ready to publish',
      },
    });

    // TODO: Trigger notification to user who created the post

    return NextResponse.json(
      {
        message: 'Post approved successfully',
        post: updatedPost,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error approving post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
