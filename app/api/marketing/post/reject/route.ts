// app/api/marketing/post/reject/route.ts
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin role required" }, { status: 403 });
    }

    const body = await request.json();
    const { postId, notes } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "Missing required field: postId" },
        { status: 400 }
      );
    }

    // Create rejection record
    const approval = await prisma.postApproval.create({
      data: {
        postId,
        approvedById: session.user.id,
        approvedAt: new Date(),
        notes,
        status: "REJECTED",
      },
    });

    // Update post status to REJECTED
    const updatedPost = await prisma.socialPost.update({
      where: { id: postId },
      data: {
        status: "REJECTED",
      },
      include: {
        createdBy: true,
        campaign: true,
        approvals: {
          include: { approvedBy: true },
        },
      },
    });

    return NextResponse.json(
      { post: updatedPost, approval },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error rejecting social post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
