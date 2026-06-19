import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyIngestSecret } from "@/lib/ingest";
import { getPlatformLimit } from "@/lib/social/platform-limits.js";

const VALID_PLATFORMS = new Set([
  "TWITTER",
  "INSTAGRAM",
  "TIKTOK",
  "LINKEDIN",
  "FACEBOOK",
]);

/** Borrador automático desde Telegram, Bedrock o scripts externos. */
export async function POST(req) {
  if (!verifyIngestSecret(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const platform = String(body.platform || "TWITTER").toUpperCase();
    const content = String(body.content || "").trim();

    if (!VALID_PLATFORMS.has(platform)) {
      return NextResponse.json({ error: "Plataforma inválida" }, { status: 400 });
    }
    if (!content || content.length < 5) {
      return NextResponse.json({ error: "Contenido demasiado corto" }, { status: 400 });
    }
    if (content.length > getPlatformLimit(platform)) {
      return NextResponse.json(
        { error: `Contenido supera el límite de ${platform}` },
        { status: 400 }
      );
    }

    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    const mediaUrls = Array.isArray(body.mediaUrls)
      ? body.mediaUrls.filter(Boolean).map(String)
      : body.imageUrl
        ? [String(body.imageUrl)]
        : [];

    const post = await prisma.socialPost.create({
      data: {
        platform,
        content,
        status: "PENDING_APPROVAL",
        campaignId: body.campaignId || null,
        scheduledAt,
        mediaUrls,
      },
    });

    return NextResponse.json({
      ok: true,
      postId: post.id,
      status: post.status,
      reviewUrl: `/marketing/pending`,
    });
  } catch (err) {
    console.error("ingest/marketing-post:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
