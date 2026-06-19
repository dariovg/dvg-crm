// app/api/marketing/posts/[id]/approve/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: postId } = await params;

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can approve
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin role required' }, { status: 403 });
    }

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

    if (post.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { error: `Cannot approve post with status: ${post.status}` },
        { status: 400 }
      );
    }

    const nextStatus =
      post.scheduledAt && new Date(post.scheduledAt) > new Date()
        ? 'SCHEDULED'
        : 'APPROVED';

    const updatedPost = await prisma.socialPost.update({
      where: { id: postId },
      data: {
        status: nextStatus,
      },
      include: {
        createdBy: true,
        approvals: {
          include: { approvedBy: true },
        },
      },
    });

    // Create approval log
    await prisma.postApproval.create({
      data: {
        postId,
        status: 'APPROVED',
        approvedById: session.user.id,
        approvedAt: new Date(),
        notes:
          nextStatus === 'SCHEDULED'
            ? `Aprobado — programado para ${post.scheduledAt?.toISOString()}`
            : 'Aprobado — listo para publicar',
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
