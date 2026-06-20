import { prisma } from "@/lib/prisma";
import { findBlobStorageUrl } from "@/lib/social/video-storage.js";

/** Sirve el vídeo en el dominio del CRM (TikTok PULL_FROM_URL). */
export async function GET(
  _request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const raw = (await params).postId;
  const postId = raw.replace(/\.mp4$/i, "");

  const post = await prisma.socialPost.findUnique({ where: { id: postId } });
  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  const blobUrl = findBlobStorageUrl(post.mediaUrls);
  if (!blobUrl) {
    return new Response("No video", { status: 404 });
  }

  const upstream = await fetch(blobUrl);
  if (!upstream.ok || !upstream.body) {
    return new Response("Video unavailable", { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") || "video/mp4");
  headers.set("Cache-Control", "public, max-age=86400");
  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);

  return new Response(upstream.body, { status: 200, headers });
}
