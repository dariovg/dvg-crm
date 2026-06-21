/**
 * Prueba de publicación X + TikTok.
 * Uso (con vars de producción en el entorno):
 *   node scripts/test-social-publish.mjs [--dry-run]
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
dotenv.config({ path: path.join(root, ".env.local") });
dotenv.config({ path: path.join(root, ".env.production.local") });

const dryRun = process.argv.includes("--dry-run");
const videoPath =
  process.argv.find((a) => a.endsWith(".mp4")) ||
  "/Users/dariovg/Downloads/video_dvg.mp4";

const prisma = new PrismaClient();

async function main() {
  const { isTwitterConfigured, publishToTwitter } = await import(
    "../lib/social/twitter.js"
  );
  const { publishToTikTok } = await import("../lib/social/tiktok.js");
  const { isTikTokConnected } = await import(
    "../lib/social/tiktok-connection.js"
  );
  const { uploadMarketingVideo, isVideoBlobConfigured } = await import(
    "../lib/social/video-storage.js"
  );

  console.log("Twitter configured:", isTwitterConfigured());
  console.log("TikTok connected:", await isTikTokConnected());
  console.log("Blob configured:", isVideoBlobConfigured());
  console.log("Video file:", videoPath, fs.existsSync(videoPath) ? "OK" : "MISSING");

  if (dryRun) {
    console.log("Dry run — no publicación.");
    return;
  }

  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const tweetText = `[TEST CRM DVG Studio] Prueba automática ${stamp}. Borraremos pronto. hacIA lo imparable · dvgsstudio.com`;

  let tweetResult = null;
  if (isTwitterConfigured()) {
    console.log("\n→ Publicando en X…");
    tweetResult = await publishToTwitter(tweetText);
    console.log("X OK:", tweetResult.url);
  } else {
    console.warn("\n⚠ X no configurado (faltan X_API_* en el entorno).");
  }

  let tiktokResult = null;
  if (await isTikTokConnected()) {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Vídeo no encontrado: ${videoPath}`);
    }

    const post = await prisma.socialPost.create({
      data: {
        platform: "TIKTOK",
        content: `Prueba CRM DVG Studio ${stamp} #test`,
        status: "APPROVED",
      },
    });

    let videoUrl;
    if (isVideoBlobConfigured()) {
      const buf = fs.readFileSync(videoPath);
      const file = new File([buf], "video_dvg.mp4", { type: "video/mp4" });
      const { publicUrl } = await uploadMarketingVideo(post.id, file);
      videoUrl = publicUrl;
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { mediaUrls: [publicUrl] },
      });
      console.log("\n→ Vídeo subido al CRM:", publicUrl);
    } else {
      throw new Error(
        "Blob no configurado. Añade BLOB_READ_WRITE_TOKEN o enlaza URL pública .mp4."
      );
    }

    console.log("→ Publicando en TikTok…");
    tiktokResult = await publishToTikTok({
      caption: post.content,
      videoUrl,
    });
    console.log("TikTok OK:", tiktokResult.externalId, tiktokResult.note || "");

    await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        externalId: tiktokResult.externalId,
      },
    });
  } else {
    console.warn("\n⚠ TikTok no conectado.");
  }

  console.log("\n--- Resumen ---");
  console.log("X:", tweetResult?.url || "omitido");
  console.log("TikTok:", tiktokResult?.externalId || "omitido");
}

main()
  .catch((err) => {
    console.error("ERROR:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
