import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { isMarketingAuthorized } from "@/lib/marketing-auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isMarketingAuthorized(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const campaigns = await prisma.campaign.findMany({
      where: { status: "ACTIVE" },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
      },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
