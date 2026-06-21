import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyIngestSecret } from "@/lib/ingest";
import { publishToTwitter, isTwitterConfigured } from "@/lib/social/twitter.js";
import { publishToTikTok } from "@/lib/social/tiktok.js";
import { isTikTokConnected } from "@/lib/social/tiktok-connection.js";
import {
  isVideoBlobConfigured,
  uploadMarketingVideo,
} from "@/lib/social/video-storage.js";

/** Smoke test X + TikTok (header x-crm-ingest-secret o Bearer CRM_INGEST_SECRET). */
export async function POST(request) {
  if (!verifyIngestSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const form = await request.formData().catch(() => null);
  const tweetText =
    form?.get("tweet") ||
    `[TEST CRM] Prueba DVG Studio ${stamp}. Borraremos pronto. dvgsstudio.com`;
  const tiktokCaption =
    form?.get("caption") ||
    `Prueba CRM DVG Studio ${stamp} #test #dvgstudio`;
  const videoFile = form?.get("video");

  const result = {
    twitter: { configured: isTwitterConfigured() },
    tiktok: { connected: await isTikTokConnected() },
    blob: isVideoBlobConfigured(),
  };

  if (isTwitterConfigured()) {
    try {
      const published = await publishToTwitter(String(tweetText));
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
          content: String(tiktokCaption),
          status: "APPROVED",
        },
      });

      const { publicUrl } = await uploadMarketingVideo(post.id, videoFile);
      const published = await publishToTikTok({
        caption: String(tiktokCaption),
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

  const ok = result.twitter?.ok || result.tiktok?.ok;
  return NextResponse.json({ ok, ...result });
}
