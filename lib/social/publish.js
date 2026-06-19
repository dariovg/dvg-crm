import { prisma } from "../prisma.js";
import { publishToTwitter, isTwitterConfigured } from "./twitter.js";

export function isPlatformPublishConfigured(platform) {
  if (platform === "TWITTER") return isTwitterConfigured();
  return false;
}

export function listConfiguredPlatforms() {
  const platforms = [];
  if (isTwitterConfigured()) platforms.push("TWITTER");
  return platforms;
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
      errorMessage: null,
    },
  });
}

/** Posts programados cuya hora ya pasó. */
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
    try {
      const updated = await publishSocialPost(post);
      results.push({ id: post.id, ok: true, externalId: updated.externalId });
    } catch (err) {
      await prisma.socialPost.update({
        where: { id: post.id },
        data: {
          status: "FAILED",
          errorMessage: err.message?.slice(0, 500) || "Error al publicar",
        },
      });
      results.push({ id: post.id, ok: false, error: err.message });
    }
  }
  return results;
}
