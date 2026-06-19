import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { canAccessMarketing } from "@/lib/permissions";

/** Posts agrupados por día para la vista domingo / semana. */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canAccessMarketing(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const campaignPrefix =
    searchParams.get("campaign") || "Simulación · Semana";

  const campaigns = await prisma.campaign.findMany({
    where: { name: { startsWith: campaignPrefix } },
    orderBy: { startDate: "desc" },
    take: 3,
  });

  const campaign = campaigns[0];
  if (!campaign) {
    return NextResponse.json({
      campaign: null,
      days: [],
      message: "No hay simulación semanal. Ejecuta run-weekly-sim.sh",
    });
  }

  const posts = await prisma.socialPost.findMany({
    where: { campaignId: campaign.id },
    include: { campaign: true },
    orderBy: [{ scheduledAt: "asc" }, { platform: "asc" }],
  });

  const byDay = new Map<
    string,
    {
      date: string;
      label: string;
      posts: typeof posts;
    }
  >();

  for (const post of posts) {
    const d = post.scheduledAt || post.createdAt;
    const key = d.toISOString().slice(0, 10);
    if (!byDay.has(key)) {
      const dateObj = new Date(`${key}T12:00:00`);
      byDay.set(key, {
        date: key,
        label: dateObj.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
        posts: [],
      });
    }
    byDay.get(key)!.posts.push(post);
  }

  const days = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      name: campaign.name,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      description: campaign.description,
    },
    days,
    totals: {
      posts: posts.length,
      pending: posts.filter((p) => p.status === "PENDING_APPROVAL").length,
      videoPlatforms: posts.filter((p) =>
        ["INSTAGRAM", "TIKTOK", "LINKEDIN"].includes(p.platform)
      ).length,
    },
  });
}
