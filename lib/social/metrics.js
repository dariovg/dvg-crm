import { TwitterApi } from "twitter-api-v2";
import { prisma } from "../prisma.js";
import { isTwitterConfigured } from "./twitter.js";
import {
  getValidTikTokAccessToken,
  isTikTokAppConfigured,
  isTikTokConnected,
} from "./tiktok-connection.js";

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function twitterClient() {
  return new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
  });
}

/** Métricas de un tweet propio vía X API v2. */
export async function fetchTwitterPostMetrics(tweetId) {
  if (!isTwitterConfigured()) {
    return { error: "X API no configurada" };
  }
  try {
    const client = twitterClient();
    const { data } = await client.v2.singleTweet(tweetId, {
      "tweet.fields": ["public_metrics", "organic_metrics", "non_public_metrics"],
    });
    if (!data) return { error: "Tweet no encontrado" };

    const pm = data.public_metrics || {};
    const om = data.organic_metrics || {};
    const nm = data.non_public_metrics || {};

    return {
      likes: om.like_count ?? pm.like_count ?? 0,
      comments: om.reply_count ?? pm.reply_count ?? 0,
      shares:
        (om.retweet_count ?? pm.retweet_count ?? 0) + (pm.quote_count ?? 0),
      impressions:
        om.impression_count ??
        nm.impression_count ??
        pm.impression_count ??
        0,
    };
  } catch (err) {
    return { error: err.message || "Error al leer métricas de X" };
  }
}

async function parseTikTokJson(res) {
  const data = await res.json().catch(() => ({}));
  const err = data?.error;
  if (!res.ok || (err && err.code !== "ok")) {
    const msg =
      err?.message ||
      data?.error_description ||
      data?.message ||
      `TikTok HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/** Lista vídeos recientes del usuario TikTok conectado. */
export async function fetchTikTokVideoList(maxCount = 20) {
  const accessToken = await getValidTikTokAccessToken();
  const fields = [
    "id",
    "title",
    "video_description",
    "view_count",
    "like_count",
    "comment_count",
    "share_count",
    "create_time",
  ].join(",");

  const res = await fetch(
    `https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(fields)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ max_count: maxCount }),
    }
  );

  const data = await parseTikTokJson(res);
  return data?.data?.videos || [];
}

/** Consulta métricas de vídeos TikTok por ID. */
export async function fetchTikTokVideosByIds(videoIds) {
  if (!videoIds.length) return [];
  const accessToken = await getValidTikTokAccessToken();
  const fields = [
    "id",
    "title",
    "video_description",
    "view_count",
    "like_count",
    "comment_count",
    "share_count",
  ].join(",");

  const res = await fetch(
    `https://open.tiktokapis.com/v2/video/query/?fields=${encodeURIComponent(fields)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ filters: { video_ids: videoIds.slice(0, 20) } }),
    }
  );

  const data = await parseTikTokJson(res);
  return data?.data?.videos || [];
}

function metricsFromTikTokVideo(video) {
  return {
    likes: video.like_count ?? 0,
    comments: video.comment_count ?? 0,
    shares: video.share_count ?? 0,
    impressions: Number(video.view_count) || 0,
    videoId: video.id,
  };
}

/** Empareja un post CRM con un vídeo TikTok por texto o fecha. */
export function matchTikTokVideoForPost(post, videos) {
  if (!videos?.length) return null;

  const needle = normalizeText(post.content).slice(0, 60);
  if (needle) {
    const byText = videos.find((v) => {
      const hay = normalizeText(v.title || v.video_description);
      return (
        hay &&
        (hay.includes(needle.slice(0, 40)) ||
          needle.includes(hay.slice(0, 40)))
      );
    });
    if (byText) return byText;
  }

  if (!post.publishedAt) return null;
  const publishedMs = new Date(post.publishedAt).getTime();
  let best = null;
  let bestDelta = Infinity;
  for (const v of videos) {
    if (!v.create_time) continue;
    const delta = Math.abs(v.create_time * 1000 - publishedMs);
    if (delta < bestDelta && delta < 48 * 3600000) {
      bestDelta = delta;
      best = v;
    }
  }
  return best;
}

export async function resolveTikTokMetrics(post, cachedVideos) {
  if (!isTikTokAppConfigured() || !(await isTikTokConnected())) {
    return { error: "TikTok no conectado" };
  }

  try {
    const externalId = String(post.externalId || "");
    if (/^\d{10,}$/.test(externalId)) {
      const queried = await fetchTikTokVideosByIds([externalId]);
      if (queried[0]) return metricsFromTikTokVideo(queried[0]);
    }

    const videos = cachedVideos || (await fetchTikTokVideoList());
    const matched = matchTikTokVideoForPost(post, videos);
    if (!matched) {
      return { error: "No se encontró el vídeo en TikTok" };
    }
    return metricsFromTikTokVideo(matched);
  } catch (err) {
    return { error: err.message || "Error TikTok metrics" };
  }
}

/** Sincroniza métricas de un post publicado. */
export async function syncPostMetrics(post, { tiktokVideos } = {}) {
  if (post.status !== "PUBLISHED") {
    return { id: post.id, skipped: true, reason: "no publicado" };
  }
  if (!post.externalId) {
    return { id: post.id, skipped: true, reason: "sin externalId" };
  }

  let metrics;
  if (post.platform === "TWITTER") {
    metrics = await fetchTwitterPostMetrics(post.externalId);
  } else if (post.platform === "TIKTOK") {
    metrics = await resolveTikTokMetrics(post, tiktokVideos);
  } else {
    return { id: post.id, skipped: true, reason: "plataforma no soportada" };
  }

  if (metrics.error) {
    return { id: post.id, ok: false, error: metrics.error };
  }

  const data = {
    likes: metrics.likes ?? 0,
    comments: metrics.comments ?? 0,
    shares: metrics.shares ?? 0,
    impressions: metrics.impressions ?? 0,
  };

  if (
    metrics.videoId &&
    post.platform === "TIKTOK" &&
    metrics.videoId !== post.externalId
  ) {
    data.externalId = metrics.videoId;
  }

  await prisma.socialPost.update({
    where: { id: post.id },
    data,
  });

  return { id: post.id, ok: true, platform: post.platform, metrics: data };
}

/** Sincroniza métricas de posts publicados recientes (X + TikTok). */
export async function syncAllPublishedMetrics({ days = 60, limit = 50 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const posts = await prisma.socialPost.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { gte: since },
      platform: { in: ["TWITTER", "TIKTOK"] },
      externalId: { not: null },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  let tiktokVideos = null;
  const hasTikTok = posts.some((p) => p.platform === "TIKTOK");
  if (hasTikTok && isTikTokAppConfigured() && (await isTikTokConnected())) {
    try {
      tiktokVideos = await fetchTikTokVideoList(20);
    } catch (err) {
      tiktokVideos = [];
      console.warn("TikTok video list:", err.message);
    }
  }

  const results = [];
  for (const post of posts) {
    results.push(await syncPostMetrics(post, { tiktokVideos }));
  }

  const summary = {
    total: results.length,
    synced: results.filter((r) => r.ok).length,
    failed: results.filter((r) => r.ok === false).length,
    skipped: results.filter((r) => r.skipped).length,
  };

  return { summary, results };
}
