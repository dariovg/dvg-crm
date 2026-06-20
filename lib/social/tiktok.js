import {
  getValidTikTokAccessToken,
  isTikTokAppConfigured,
  isTikTokConnected,
} from "./tiktok-connection.js";
import { findPublicVideoUrl } from "./video-storage.js";

export { isTikTokAppConfigured, isTikTokConnected };

/** URL pública del vídeo para TikTok (CRM o externa). */
export function pickVideoUrl(mediaUrls = [], postId) {
  if (postId) {
    const crm = findPublicVideoUrl(mediaUrls, postId);
    if (crm) return crm;
  }
  for (const url of mediaUrls) {
    if (!url || typeof url !== "string") continue;
    if (/\.mp3(\?|$)/i.test(url)) continue;
    if (url.includes("blob.vercel-storage.com")) continue;
    if (/^https:\/\/.+/i.test(url)) return url;
  }
  return null;
}

async function parseTikTokResponse(res) {
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

async function fetchPublishStatus(accessToken, publishId) {
  const res = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/status/fetch/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ publish_id: publishId }),
    }
  );
  return parseTikTokResponse(res);
}

/**
 * Publica vídeo en TikTok vía PULL_FROM_URL.
 * El dominio del vídeo debe estar verificado en TikTok Developer Portal.
 */
export async function publishToTikTok({ caption, videoUrl }) {
  if (!videoUrl) {
    throw new Error(
      "TikTok requiere un vídeo. Enlaza la URL del .mp4 en el post (Vista domingo → Enlazar vídeo)."
    );
  }
  if (!/^https:\/\/.+/i.test(videoUrl)) {
    throw new Error("La URL del vídeo debe ser HTTPS y accesible públicamente.");
  }
  const isCrmVideo = /\/api\/marketing\/video\/.+\.mp4/i.test(videoUrl);
  if (
    !isCrmVideo &&
    !/^https:\/\/.+\.(mp4|mov|webm)(\?.*)?$/i.test(videoUrl)
  ) {
    throw new Error(
      "Sube el vídeo al CRM o usa una URL .mp4 / .mov / .webm pública."
    );
  }

  const accessToken = await getValidTikTokAccessToken();
  const privacyLevel =
    process.env.TIKTOK_PRIVACY_LEVEL?.trim() || "SELF_ONLY";
  const title = String(caption || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);

  const initRes = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/video/init/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: title || "DVG Studio",
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: videoUrl,
        },
      }),
    }
  );

  const initData = await parseTikTokResponse(initRes);
  const publishId = initData?.data?.publish_id;
  if (!publishId) {
    throw new Error("TikTok no devolvió publish_id");
  }

  // Poll breve (publicación asíncrona)
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const statusData = await fetchPublishStatus(accessToken, publishId);
    const status = statusData?.data?.status;
    if (status === "PUBLISH_COMPLETE") {
      return {
        externalId: publishId,
        url: null,
        privacyLevel,
        note:
          privacyLevel === "SELF_ONLY"
            ? "Publicado en modo privado (app sin auditar). Solo tú lo ves hasta pasar revisión TikTok."
            : undefined,
      };
    }
    if (status === "FAILED") {
      const reason =
        statusData?.data?.fail_reason || "TikTok rechazó la publicación";
      throw new Error(reason);
    }
  }

  return {
    externalId: publishId,
    url: null,
    note: "Enviado a TikTok — procesando. Revisa la app en unos minutos.",
  };
}
