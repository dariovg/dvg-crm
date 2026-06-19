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

function appendSourceNote(content, sourceUrl, newsTitle, platform) {
  if (platform === "TWITTER") return content;
  if (!sourceUrl && !newsTitle) return content;
  const note = newsTitle
    ? `\n\n📰 ${newsTitle}${sourceUrl ? `\n${sourceUrl}` : ""}`
    : sourceUrl
      ? `\n\n🔗 ${sourceUrl}`
      : "";
  return `${content}${note}`.trim();
}

async function createDraft({
  platform,
  content,
  campaignId,
  scheduledAt,
  mediaUrls,
  sourceUrl,
  newsTitle,
}) {
  const plat = String(platform || "TWITTER").toUpperCase();
  const text = appendSourceNote(
    String(content || "").trim(),
    sourceUrl,
    newsTitle,
    plat
  );

  if (!VALID_PLATFORMS.has(plat)) {
    return { error: "Plataforma inválida", platform: plat };
  }
  if (!text || text.length < 5) {
    return { error: "Contenido demasiado corto", platform: plat };
  }
  const limit = getPlatformLimit(plat);
  if (text.length > limit) {
    return {
      error: `Contenido supera ${limit} caracteres en ${plat}`,
      platform: plat,
    };
  }

  const post = await prisma.socialPost.create({
    data: {
      platform: plat,
      content: text.slice(0, limit),
      status: "PENDING_APPROVAL",
      campaignId: campaignId || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
    },
  });

  return { ok: true, postId: post.id, platform: plat, status: post.status };
}

/** Borrador automático desde Bedrock, Telegram o scripts externos. */
export async function POST(req) {
  if (!verifyIngestSecret(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (Array.isArray(body.posts) && body.posts.length > 0) {
      const results = [];
      for (const item of body.posts) {
        results.push(
          await createDraft({
            platform: item.platform,
            content: item.content,
            campaignId: item.campaignId || body.campaignId,
            scheduledAt: item.scheduledAt || body.scheduledAt,
            mediaUrls: item.mediaUrls,
            sourceUrl: item.sourceUrl || body.sourceUrl,
            newsTitle: item.newsTitle || body.newsTitle,
          })
        );
      }
      const created = results.filter((r) => r.ok);
      const errors = results.filter((r) => r.error);
      return NextResponse.json({
        ok: errors.length === 0,
        created: created.length,
        postIds: created.map((r) => r.postId),
        results,
        reviewUrl: "/marketing/pending",
      });
    }

    const single = await createDraft({
      platform: body.platform,
      content: body.content,
      campaignId: body.campaignId,
      scheduledAt: body.scheduledAt,
      mediaUrls: body.mediaUrls || (body.imageUrl ? [body.imageUrl] : []),
      sourceUrl: body.sourceUrl,
      newsTitle: body.newsTitle,
    });

    if (single.error) {
      return NextResponse.json({ error: single.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      postId: single.postId,
      status: single.status,
      reviewUrl: "/marketing/pending",
    });
  } catch (err) {
    console.error("ingest/marketing-post:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
