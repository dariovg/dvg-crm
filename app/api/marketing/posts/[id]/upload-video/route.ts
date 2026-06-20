import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { canApproveMarketingPosts } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  uploadMarketingVideo,
  isVideoBlobConfigured,
} from "@/lib/social/video-storage.js";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canApproveMarketingPosts(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isVideoBlobConfigured()) {
    return NextResponse.json(
      {
        error:
          "Crea un Blob store en Vercel (proyecto dvg-crm) → Storage → Connect → copia BLOB_READ_WRITE_TOKEN a env.",
      },
      { status: 503 }
    );
  }

  const { id: postId } = await params;
  const post = await prisma.socialPost.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get("video");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Falta archivo video" }, { status: 400 });
  }

  try {
    const { blobUrl, publicUrl } = await uploadMarketingVideo(postId, file);
    const audioUrls = (post.mediaUrls || []).filter((u) =>
      /\.mp3(\?|$)/i.test(u)
    );

    const updated = await prisma.socialPost.update({
      where: { id: postId },
      data: { mediaUrls: [...audioUrls, blobUrl, publicUrl] },
    });

    return NextResponse.json({
      ok: true,
      publicUrl,
      post: updated,
      tiktokHint:
        "Verifica en TikTok Developer el prefijo URL: https://crm.dvgsstudio.com/api/marketing/video/",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al subir";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
