import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishToTwitter, isTwitterConfigured } from "@/lib/social/twitter.js";
import { publishToTikTok } from "@/lib/social/tiktok.js";
import { isTikTokConnected } from "@/lib/social/tiktok-connection.js";
import {
  isVideoBlobConfigured,
  uploadMarketingVideo,
} from "@/lib/social/video-storage.js";

function authorized(request: NextRequest) {
  const secret =
    process.env.CRON_SECRET?.trim() ||
    process.env.CRM_INGEST_SECRET?.trim() ||
    "";
  if (!secret) return false;
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const ingest = request.headers.get("x-crm-ingest-secret");
  return auth === secret || ingest === secret;
}

/** Smoke test X + TikTok (solo con CRON_SECRET o CRM_INGEST_SECRET). */
export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const form = await request.formData().catch(() => null);
  const tweetText =
    (form?.get("tweet") as string) ||
    `[TEST CRM] Prueba DVG Studio ${stamp}. Borraremos pronto. dvgsstudio.com`;
  const tiktokCaption =
    (form?.get("caption") as string) ||
    `Prueba CRM DVG Studio ${stamp} #test #dvgstudio`;
  const videoFile = form?.get("video");

  const result: Record<string, unknown> = {
    twitter: { configured: isTwitterConfigured() },
    tiktok: { connected: await isTikTokConnected() },
    blob: isVideoBlobConfigured(),
  };

  if (isTwitterConfigured()) {
    try {
      const published = await publishToTwitter(tweetText);
      result.twitter = { ok: true, ...published };
    } catch (err) {
      result.twitter = {
        ok: false,
        error: err instanceof Error ? err.message : "twitter_error",
      };
    }
  } else {
    result.twitter = { ok: false, error: "not_configured" };
  }

  if (await isTikTokConnected()) {
    try {
      if (!videoFile || typeof videoFile === "string") {
        throw new Error("Falta archivo video en multipart (campo video)");
      }
      if (!isVideoBlobConfigured()) {
        throw new Error("BLOB_READ_WRITE_TOKEN no configurado");
      }

      const post = await prisma.socialPost.create({
        data: {
          platform: "TIKTOK",
          content: tiktokCaption,
          status: "APPROVED",
        },
      });

      const { publicUrl } = await uploadMarketingVideo(post.id, videoFile);
      const published = await publishToTikTok({
        caption: tiktokCaption,
        videoUrl: publicUrl,
      });

      await prisma.socialPost.update({
        where: { id: post.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          externalId: published.externalId,
          mediaUrls: [publicUrl],
        },
      });

      result.tiktok = {
        ok: true,
        postId: post.id,
        videoUrl: publicUrl,
        ...published,
      };
    } catch (err) {
      result.tiktok = {
        ok: false,
        error: err instanceof Error ? err.message : "tiktok_error",
      };
    }
  } else {
    result.tiktok = { ok: false, error: "not_connected" };
  }

  const ok =
    (result.twitter as { ok?: boolean })?.ok ||
    (result.tiktok as { ok?: boolean })?.ok;

  return NextResponse.json({ ok, ...result });
}
