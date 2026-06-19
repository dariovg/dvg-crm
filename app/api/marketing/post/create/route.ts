// app/api/marketing/post/create/route.ts
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getPlatformLimit } from "@/lib/social/platform-limits.js";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

    const text = String(content || "").trim();
    if (!platform || !text) {
      return NextResponse.json(
        { error: "Plataforma y contenido son obligatorios" },
        { status: 400 }
      );
    }

    const limit = getPlatformLimit(platform);
    if (text.length > limit) {
      return NextResponse.json(
        { error: `Máximo ${limit} caracteres para ${platform}` },
        { status: 400 }
      );
    }

    const post = await prisma.socialPost.create({
      data: {
        platform,
        content: text,
        campaignId: campaignId || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
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
