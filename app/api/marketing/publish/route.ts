// app/api/marketing/publish/route.ts
// Endpoint para publicar en X (Twitter)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import { XPublisher } from "@/lib/social-media/publishers/x.publisher";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
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

  const results: any = {};

  // Publicar en X
  if (platforms.includes("X")) {
    try {
      const xPublisher = new XPublisher();
      const xResult = await xPublisher.publishTweet(content.x || content.text);
      results.X = xResult;
    } catch (error) {
      results.X = { 
        success: false, 
        error: error instanceof Error ? error.message : "X API error" 
      };
    }
  }

  // TikTok, Instagram, LinkedIn no disponibles
  if (platforms.includes("TIKTOK")) {
    results.TIKTOK = {
      success: false,
      error: "TikTok API no disponible (sin acceso oficial)",
    };
  }

  if (platforms.includes("INSTAGRAM")) {
    results.INSTAGRAM = {
      success: false,
      error: "Instagram API requiere Facebook Business Account",
    };
  }

  if (platforms.includes("LINKEDIN")) {
    results.LINKEDIN = {
      success: false,
      error: "LinkedIn API no configurada",
    };
  }

  return NextResponse.json({
    success: Object.values(results).some((r: any) => r.success === true),
    results,
  });
}
