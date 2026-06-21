import { prisma } from "../prisma.js";
import { publishToTwitter, isTwitterConfigured } from "./twitter.js";
import {
  publishToTikTok,
  pickVideoUrl,
  isTikTokAppConfigured,
} from "./tiktok.js";
import { isTikTokConnected } from "./tiktok-connection.js";
import {
  publishToLinkedIn,
  isLinkedInAppConfigured,
} from "./linkedin.js";
import { isLinkedInConnected } from "./linkedin-connection.js";
import {
  publishToYouTube,
  isYouTubeAppConfigured,
} from "./youtube.js";
import { isYouTubeConnected } from "./youtube-connection.js";

export const MAX_PUBLISH_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = [0, 30 * 60 * 1000, 2 * 60 * 60 * 1000];

export function publishRetryBackoffMs(attempts) {
  const idx = Math.min(Math.max(attempts, 0), RETRY_BACKOFF_MS.length - 1);
  return RETRY_BACKOFF_MS[idx];
}

export function isReadyForPublishRetry(post) {
  if ((post.publishAttempts || 0) >= MAX_PUBLISH_ATTEMPTS) return false;
  if (!post.lastPublishAttemptAt) return true;
  const wait = publishRetryBackoffMs(post.publishAttempts || 0);
  return (
    Date.now() - new Date(post.lastPublishAttemptAt).getTime() >= wait
  );
}

export function isPlatformPublishConfigured(platform) {
  if (platform === "TWITTER") return isTwitterConfigured();
  if (platform === "TIKTOK") return isTikTokAppConfigured();
  if (platform === "LINKEDIN") return isLinkedInAppConfigured();
  if (platform === "YOUTUBE") return isYouTubeAppConfigured();
  return false;
}

export async function isPlatformReadyToPublish(platform) {
  if (platform === "TWITTER") return isTwitterConfigured();
  if (platform === "TIKTOK") {
    return isTikTokAppConfigured() && (await isTikTokConnected());
  }
  if (platform === "LINKEDIN") {
    return isLinkedInAppConfigured() && (await isLinkedInConnected());
  }
  if (platform === "YOUTUBE") {
    return isYouTubeAppConfigured() && (await isYouTubeConnected());
  }
  return false;
}

export async function listConfiguredPlatforms() {
  const platforms = [];
  if (isTwitterConfigured()) platforms.push("TWITTER");
  if (isTikTokAppConfigured() && (await isTikTokConnected())) {
    platforms.push("TIKTOK");
  }
  if (isLinkedInAppConfigured() && (await isLinkedInConnected())) {
    platforms.push("LINKEDIN");
  }
  if (isYouTubeAppConfigured() && (await isYouTubeConnected())) {
    platforms.push("YOUTUBE");
  }
  return platforms;
}

/** Registra fallo de publicación con reintentos y backoff. */
export async function recordPublishFailure(post, err) {
  const attempts = (post.publishAttempts || 0) + 1;
  const message = err?.message?.slice(0, 500) || "Error al publicar";
  const permanent = attempts >= MAX_PUBLISH_ATTEMPTS;

  return prisma.socialPost.update({
    where: { id: post.id },
    data: {
      publishAttempts: attempts,
      lastPublishAttemptAt: new Date(),
      errorMessage: message,
      status: permanent ? "FAILED" : post.status,
    },
  });
}

/** Publica un post ya aprobado o programado en la red correspondiente. */
export async function publishSocialPost(post) {
  if (!["APPROVED", "SCHEDULED"].includes(post.status)) {
    throw new Error(
      `Solo se pueden publicar posts aprobados o programados (estado actual: ${post.status}).`
    );
  }

  if (post.scheduledAt && new Date(post.scheduledAt) > new Date()) {
    throw new Error("Este post está programado para más tarde.");
  }

  let result;
  switch (post.platform) {
    case "TWITTER":
      result = await publishToTwitter(post.content);
      break;
    case "TIKTOK": {
      const videoUrl = pickVideoUrl(post.mediaUrls, post.id);
      result = await publishToTikTok({
        caption: post.content,
        videoUrl,
      });
      break;
    }
    case "LINKEDIN":
      result = await publishToLinkedIn(post.content);
      break;
    case "YOUTUBE": {
      result = await publishToYouTube({
        content: post.content,
        mediaUrls: post.mediaUrls,
        postId: post.id,
      });
      break;
    }
    default:
      throw new Error(
        `Publicación automática para ${post.platform} aún no disponible. Copia el contenido y publícalo manualmente.`
      );
  }

  return prisma.socialPost.update({
    where: { id: post.id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      externalId: result.externalId,
      errorMessage: result.note?.slice(0, 500) || null,
      publishAttempts: 0,
      lastPublishAttemptAt: null,
    },
  });
}

/** Posts programados cuya hora ya pasó (con reintentos automáticos). */
export async function publishDueScheduledPosts() {
  const due = await prisma.socialPost.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: new Date() },
    },
    take: 20,
  });

  const results = [];
  for (const post of due) {
    if (!isReadyForPublishRetry(post)) {
      results.push({
        id: post.id,
        ok: false,
        skipped: true,
        reason: "backoff",
        attempts: post.publishAttempts,
      });
      continue;
    }

    try {
      const updated = await publishSocialPost(post);
      results.push({ id: post.id, ok: true, externalId: updated.externalId });
    } catch (err) {
      const updated = await recordPublishFailure(post, err);
      results.push({
        id: post.id,
        ok: false,
        error: err.message,
        attempts: updated.publishAttempts,
        permanent: updated.status === "FAILED",
      });
    }
  }
  return results;
}
