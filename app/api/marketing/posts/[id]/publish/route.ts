import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { publishSocialPost, isPlatformPublishConfigured } from "@/lib/social/publish.js";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Solo administración" }, { status: 403 });
    }

    const post = await prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
    }

    if (!isPlatformPublishConfigured(post.platform)) {
      return NextResponse.json(
        {
          error: `API de ${post.platform} no configurada en el servidor.`,
          manual: true,
        },
        { status: 503 }
      );
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

    try {
      await prisma.socialPost.update({
        where: { id: postId },
        data: { status: "FAILED", errorMessage: message.slice(0, 500) },
      });
    } catch {
      /* ignore */
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
