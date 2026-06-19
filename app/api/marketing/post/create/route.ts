// app/api/marketing/post/create/route.ts
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

    if (session.user.role !== "ADMIN" && session.user.role !== "MARKETING") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      platform,
      content,
      campaignId,
      scheduledAt,
      mediaUrls = [],
    } = body;

    if (!platform || !content) {
      return NextResponse.json(
        { error: "Missing required fields: platform, content" },
        { status: 400 }
      );
    }

    const post = await prisma.socialPost.create({
      data: {
        platform,
        content,
        campaignId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        mediaUrls,
        createdById: session.user.id,
        status: "PENDING_APPROVAL",
      },
      include: {
        createdBy: true,
        campaign: true,
        approvals: true,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating social post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
