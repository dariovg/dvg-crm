import { put } from "@vercel/blob";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function isProfileBlobConfigured() {
  return !!(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.BLOB_STORE_ID?.trim()
  );
}

export async function uploadProfileImage(userId, file) {
  if (!isProfileBlobConfigured()) {
    throw new Error(
      "Almacenamiento de imágenes no configurado (Blob en Vercel)."
    );
  }
  if (!file?.type || !ALLOWED.has(file.type)) {
    throw new Error("Usa JPG, PNG, WebP o GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Imagen demasiado grande (máx. 5 MB).");
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";

  const blob = await put(`profiles/${userId}.${ext}`, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: true,
  });

  return blob.url;
}
