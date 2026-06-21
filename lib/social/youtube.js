import { pickVideoUrl } from "./tiktok.js";
import { findBlobStorageUrl } from "./video-storage.js";
import {
  getValidYouTubeAccessToken,
  isYouTubeAppConfigured,
  isYouTubeConnected,
} from "./youtube-connection.js";

export { isYouTubeAppConfigured, isYouTubeConnected };

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 5000;

/** Primera línea = título; resto = descripción. */
export function splitYouTubeContent(content) {
  const raw = String(content || "").trim();
  const lines = raw.split(/\r?\n/);
  const title = (lines[0] || "DVG Studio").slice(0, TITLE_MAX);
  const body = lines.slice(1).join("\n").trim();
  const description = (body || raw).slice(0, DESCRIPTION_MAX);
  return { title, description };
}

async function loadVideoBytes(mediaUrls, postId) {
  const blobUrl = findBlobStorageUrl(mediaUrls);
  const publicUrl = pickVideoUrl(mediaUrls, postId);

  let fetchUrl = blobUrl || publicUrl;
  if (!fetchUrl) {
    throw new Error(
      "YouTube requiere un vídeo. Sube el .mp4 en Vista domingo o enlaza una URL pública."
    );
  }

  if (
    !blobUrl &&
    publicUrl &&
    /\/api\/marketing\/video\//.test(publicUrl)
  ) {
    fetchUrl = publicUrl;
  }

  const res = await fetch(fetchUrl);
  if (!res.ok) {
    throw new Error(`No se pudo descargar el vídeo (${res.status}).`);
  }

  const contentType =
    res.headers.get("content-type")?.split(";")[0]?.trim() || "video/mp4";
  const buffer = Buffer.from(await res.arrayBuffer());

  if (buffer.length === 0) {
    throw new Error("El vídeo descargado está vacío.");
  }

  return { buffer, contentType };
}

/**
 * Sube vídeo a YouTube vía resumable upload (YouTube Data API v3).
 * content: primera línea = título, resto = descripción.
 */
export async function publishToYouTube({ content, mediaUrls, postId }) {
  const { title, description } = splitYouTubeContent(content);
  const { buffer, contentType } = await loadVideoBytes(mediaUrls, postId);
  const accessToken = await getValidYouTubeAccessToken();
  const privacyStatus =
    process.env.YOUTUBE_PRIVACY_STATUS?.trim().toLowerCase() || "unlisted";
  const categoryId = process.env.YOUTUBE_CATEGORY_ID?.trim() || "22";

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": contentType,
        "X-Upload-Content-Length": String(buffer.length),
      },
      body: JSON.stringify({
        snippet: {
          title,
          description,
          categoryId,
        },
        status: {
          privacyStatus,
          selfDeclaredMadeForKids: false,
        },
      }),
    }
  );

  const initData = await initRes.json().catch(() => ({}));
  if (!initRes.ok) {
    throw new Error(
      initData?.error?.message ||
        `YouTube init upload HTTP ${initRes.status}`
    );
  }

  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) {
    throw new Error("YouTube no devolvió URL de subida.");
  }

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.length),
    },
    body: buffer,
  });

  const uploadData = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok) {
    throw new Error(
      uploadData?.error?.message ||
        `YouTube upload HTTP ${uploadRes.status}`
    );
  }

  const videoId = uploadData?.id;
  if (!videoId) {
    throw new Error("YouTube no devolvió ID del vídeo.");
  }

  const note =
    privacyStatus !== "public"
      ? `Publicado como ${privacyStatus}. Cambia YOUTUBE_PRIVACY_STATUS=public en Vercel si quieres vídeos públicos.`
      : undefined;

  return {
    externalId: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    note,
  };
}
