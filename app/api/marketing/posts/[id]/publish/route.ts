import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { publishSocialPost, isPlatformReadyToPublish, recordPublishFailure } from "@/lib/social/publish.js";
import { pickVideoUrl } from "@/lib/social/tiktok.js";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  let post = null;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Solo administración" }, { status: 403 });
    }

    post = await prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
    }

    if (!(await isPlatformReadyToPublish(post.platform))) {
      return NextResponse.json(
        {
          error: `API de ${post.platform} no configurada. Ve a Marketing → Resumen.`,
          manual: true,
        },
        { status: 503 }
      );
    }

    if (post.platform === "TIKTOK" && !pickVideoUrl(post.mediaUrls, postId)) {
      return NextResponse.json(
        {
          error:
            "TikTok requiere URL de vídeo (.mp4). Enlázala en Vista domingo antes de publicar.",
          manual: true,
        },
        { status: 400 }
      );
    }

    if (post.platform === "YOUTUBE" && !pickVideoUrl(post.mediaUrls, postId)) {
      return NextResponse.json(
        {
          error:
            "YouTube requiere un vídeo (.mp4). Súbelo o enlázalo en Vista domingo antes de publicar.",
          manual: true,
        },
        { status: 400 }
      );
    }

    if (post.status === "FAILED") {
      post = await prisma.socialPost.update({
        where: { id: postId },
        data: {
          status: "APPROVED",
          publishAttempts: 0,
          lastPublishAttemptAt: null,
          errorMessage: null,
        },
      });
    }

    const updated = await publishSocialPost(post);

    await prisma.postApproval.create({
      data: {
        postId,
        status: "PUBLISHED",
        approvedById: session.user.id,
        approvedAt: new Date(),
        notes: `Publicado en ${post.platform}`,
      },
    });

    return NextResponse.json({
      message: "Publicado correctamente",
      post: updated,
      url:
        post.platform === "TWITTER" && updated.externalId
          ? `https://x.com/i/web/status/${updated.externalId}`
          : null,
    });
  } catch (error) {
    console.error("Error publishing post:", error);
    const message =
      error instanceof Error ? error.message : "Error interno al publicar";

    if (post) {
      const updated = await recordPublishFailure(
        post,
        error instanceof Error ? error : new Error(message)
      );
      return NextResponse.json(
        {
          error: message,
          attempts: updated.publishAttempts,
          permanent: updated.status === "FAILED",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
