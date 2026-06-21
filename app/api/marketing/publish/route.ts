import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import {
  isTwitterConfigured,
  publishToTwitter,
} from "@/lib/social/twitter.js";
import { publishToTikTok } from "@/lib/social/tiktok.js";
import { isTikTokConnected } from "@/lib/social/tiktok-connection.js";
import { publishToLinkedIn } from "@/lib/social/linkedin.js";
import {
  isLinkedInAppConfigured,
  isLinkedInConnected,
} from "@/lib/social/linkedin-connection.js";
import { publishToYouTube } from "@/lib/social/youtube.js";
import {
  isYouTubeAppConfigured,
  isYouTubeConnected,
} from "@/lib/social/youtube-connection.js";

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
    if (!isLinkedInAppConfigured()) {
      results.LINKEDIN = {
        success: false,
        error:
          "LinkedIn API no configurada. Añade LINKEDIN_CLIENT_ID y LINKEDIN_CLIENT_SECRET en Vercel.",
      };
    } else if (!(await isLinkedInConnected())) {
      results.LINKEDIN = {
        success: false,
        error: "Conecta LinkedIn en Marketing → Conexiones.",
      };
    } else {
      try {
        const text = String(
          content.linkedin || content.text || ""
        ).trim();
        const published = await publishToLinkedIn(text);
        results.LINKEDIN = {
          success: true,
          tweetId: published.externalId,
        };
      } catch (error) {
        results.LINKEDIN = {
          success: false,
          error: error instanceof Error ? error.message : "LinkedIn API error",
        };
      }
    }
  }

  if (platforms.includes("YOUTUBE")) {
    if (!isYouTubeAppConfigured()) {
      results.YOUTUBE = {
        success: false,
        error:
          "YouTube API no configurada. Añade GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en Vercel.",
      };
    } else if (!(await isYouTubeConnected())) {
      results.YOUTUBE = {
        success: false,
        error: "Conecta YouTube en Marketing → Conexiones.",
      };
    } else {
      try {
        const videoUrl = content.videoUrl || content.video_url;
        const published = await publishToYouTube({
          content: content.youtube || content.text,
          mediaUrls: videoUrl ? [videoUrl] : [],
          postId: content.postId,
        });
        results.YOUTUBE = {
          success: true,
          tweetId: published.externalId,
          url: published.url,
        };
      } catch (error) {
        results.YOUTUBE = {
          success: false,
          error: error instanceof Error ? error.message : "YouTube API error",
        };
      }
    }
  }

  return NextResponse.json({
    success: Object.values(results).some((r) => r.success),
    results,
  });
}
