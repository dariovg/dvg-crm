import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { canApproveMarketingPosts } from "@/lib/permissions";

/** Adjuntar URL de vídeo tras grabarlo manualmente. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canApproveMarketingPosts(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const videoUrl = String(body.videoUrl || "").trim();

  if (!videoUrl || !/^https?:\/\//i.test(videoUrl)) {
    return NextResponse.json(
      { error: "videoUrl debe ser una URL https válida" },
      { status: 400 }
    );
  }

  const post = await prisma.socialPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
  }

  const mediaUrls = [...(post.mediaUrls || [])];
  const audioUrls = mediaUrls.filter((u) => /\.mp3(\?|$)/i.test(u));
  const updated = await prisma.socialPost.update({
    where: { id },
    data: { mediaUrls: [...audioUrls, videoUrl] },
  });

  return NextResponse.json({ ok: true, post: updated });
}
