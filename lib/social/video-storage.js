import { put } from "@vercel/blob";

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

export function isVideoBlobConfigured() {
  return !!(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.BLOB_STORE_ID?.trim()
  );
}

export function getCrmVideoPublicUrl(postId) {
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "";
  return `${base}/api/marketing/video/${postId}.mp4`;
}

export function findBlobStorageUrl(mediaUrls = []) {
  for (const url of mediaUrls) {
    if (
      typeof url === "string" &&
      (url.includes("blob.vercel-storage.com") || url.startsWith("blob:"))
    ) {
      return url.replace(/^blob:/, "");
    }
  }
  return null;
}

export function findPublicVideoUrl(mediaUrls = [], postId) {
  const crmUrl = getCrmVideoPublicUrl(postId);
  if (mediaUrls.includes(crmUrl)) return crmUrl;
  for (const url of mediaUrls) {
    if (!url || typeof url !== "string") continue;
    if (/\.mp3(\?|$)/i.test(url)) continue;
    if (/^https:\/\/.+/i.test(url)) return url;
  }
  return findBlobStorageUrl(mediaUrls) ? crmUrl : null;
}

export async function uploadMarketingVideo(postId, file) {
  if (!isVideoBlobConfigured()) {
    throw new Error(
      "Almacenamiento de vídeo no configurado. Crea un Blob store en Vercel (proyecto dvg-crm) y añade BLOB_READ_WRITE_TOKEN."
    );
  }
  if (!file?.type?.startsWith("video/")) {
    throw new Error("El archivo debe ser un vídeo (mp4, mov, webm).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Vídeo demasiado grande (máx. 100 MB).");
  }

  const blob = await put(`marketing/videos/${postId}.mp4`, file, {
    access: "public",
    contentType: file.type || "video/mp4",
    addRandomSuffix: false,
  });

  const publicUrl = getCrmVideoPublicUrl(postId);
  return { blobUrl: blob.url, publicUrl };
}
