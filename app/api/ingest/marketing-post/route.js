import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyIngestSecret } from "@/lib/ingest";
import { getPlatformLimit } from "@/lib/social/platform-limits.js";
import { rateLimitResponse } from "@/lib/rate-limit";

const VALID_PLATFORMS = new Set([
  "TWITTER",
  "INSTAGRAM",
  "TIKTOK",
  "LINKEDIN",
  "FACEBOOK",
  "YOUTUBE",
]);

function appendSourceNote(content, sourceUrl, newsTitle, platform) {
  // Guiones cortos: la fuente va en metadata del CRM, no en el copy publicado.
  if (platform === "TWITTER" || platform === "TIKTOK" || platform === "YOUTUBE")
    return content;
  if (!sourceUrl && !newsTitle) return content;
  const note = newsTitle
    ? `\n\n📰 ${newsTitle}${sourceUrl ? `\n${sourceUrl}` : ""}`
    : sourceUrl
      ? `\n\n🔗 ${sourceUrl}`
      : "";
  return `${content}${note}`.trim();
}

async function resolveCampaignId(body) {
  if (body.campaignId) return body.campaignId;
  const name = body.campaignName?.trim();
  if (!name) return null;

  const existing = await prisma.campaign.findFirst({ where: { name } });
  if (existing) return existing.id;

  const start = body.weekStart ? new Date(body.weekStart) : new Date();
  const end = body.weekEnd
    ? new Date(body.weekEnd)
    : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  const created = await prisma.campaign.create({
    data: {
      name,
      startDate: start,
      endDate: end,
      status: "ACTIVE",
      description:
        body.campaignDescription ||
        "Plan semanal generado automáticamente (Bedrock)",
    },
  });
  return created.id;
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
  const limited = rateLimitResponse(req, "ingest-marketing-post", {
    limit: 30,
    windowMs: 60_000,
  });
  if (limited) return limited;

  if (!verifyIngestSecret(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (Array.isArray(body.posts) && body.posts.length > 0) {
      const campaignId = await resolveCampaignId(body);
      const results = [];
      for (const item of body.posts) {
        results.push(
          await createDraft({
            platform: item.platform,
            content: item.content,
            campaignId: item.campaignId || campaignId,
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
        reviewUrl: body.campaignName?.includes("Simulación")
          ? "/marketing/semana"
          : "/marketing/pending",
        weekReviewUrl: "/marketing/semana",
      });
    }

    const campaignId = await resolveCampaignId(body);
    const single = await createDraft({
      platform: body.platform,
      content: body.content,
      campaignId,
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
