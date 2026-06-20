import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

/** Posts con fecha relevante para el calendario editorial. */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "MARKETING") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: "from y to son obligatorios (ISO)" },
        { status: 400 }
      );
    }

    const from = new Date(fromParam);
    const to = new Date(toParam);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 });
    }

    const posts = await prisma.socialPost.findMany({
      where: {
        status: {
          in: [
            "PENDING_APPROVAL",
            "APPROVED",
            "SCHEDULED",
            "PUBLISHED",
            "REJECTED",
          ],
        },
        OR: [
          { scheduledAt: { gte: from, lte: to } },
          { publishedAt: { gte: from, lte: to } },
          {
            scheduledAt: null,
            publishedAt: null,
            createdAt: { gte: from, lte: to },
          },
        ],
      },
      select: {
        id: true,
        content: true,
        platform: true,
        status: true,
        scheduledAt: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    });

    const items = posts.map((post) => {
      let calendarAt = post.createdAt;
      if (post.status === "PUBLISHED" && post.publishedAt) {
        calendarAt = post.publishedAt;
      } else if (post.scheduledAt) {
        calendarAt = post.scheduledAt;
      }
      return {
        ...post,
        calendarAt: calendarAt.toISOString(),
      };
    });

    return NextResponse.json({ posts: items });
  } catch (error) {
    console.error("marketing/calendar:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
