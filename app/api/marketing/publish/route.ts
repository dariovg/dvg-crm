import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import {
  isTwitterConfigured,
  publishToTwitter,
} from "@/lib/social/twitter.js";
import { publishToTikTok } from "@/lib/social/tiktok.js";
import { isTikTokConnected } from "@/lib/social/tiktok-connection.js";

type PublishResult = {
  success: boolean;
  error?: string;
  tweetId?: string;
  url?: string;
};

/** Publicación multi-plataforma (legacy). Preferir POST /api/marketing/posts/[id]/publish */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only ADMIN can publish" }, { status: 403 });
  }

  const body = await request.json();
  const { platforms, content } = body;

  if (!platforms || !Array.isArray(platforms) || !content) {
    return NextResponse.json(
      { error: "Missing platforms or content" },
      { status: 400 }
    );
  }

  const results: Record<string, PublishResult> = {};

  if (platforms.includes("X") || platforms.includes("TWITTER")) {
    if (!isTwitterConfigured()) {
      results.X = {
        success: false,
        error:
          "X API no configurada. Añade X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN y X_ACCESS_TOKEN_SECRET en Vercel.",
      };
    } else {
      try {
        const text = String(content.x || content.text || "").trim();
        const published = await publishToTwitter(text);
        results.X = {
          success: true,
          tweetId: published.externalId,
          url: published.url,
        };
      } catch (error) {
        results.X = {
          success: false,
          error: error instanceof Error ? error.message : "X API error",
        };
      }
    }
  }

  if (platforms.includes("TIKTOK")) {
    if (!(await isTikTokConnected())) {
      results.TIKTOK = {
        success: false,
        error: "Conecta TikTok en Marketing → Conexiones.",
      };
    } else {
      try {
        const videoUrl = content.videoUrl || content.video_url;
        const published = await publishToTikTok({
          caption: content.tiktok || content.text,
          videoUrl,
        });
        results.TIKTOK = {
          success: true,
          tweetId: published.externalId,
        };
      } catch (error) {
        results.TIKTOK = {
          success: false,
          error: error instanceof Error ? error.message : "TikTok API error",
        };
      }
    }
  }

  if (platforms.includes("INSTAGRAM")) {
    results.INSTAGRAM = {
      success: false,
      error: "Instagram requiere Meta Business + vídeo/imagen.",
    };
  }

  if (platforms.includes("LINKEDIN")) {
    results.LINKEDIN = {
      success: false,
      error: "LinkedIn API aún no configurada en el CRM.",
    };
  }

  return NextResponse.json({
    success: Object.values(results).some((r) => r.success),
    results,
  });
}
