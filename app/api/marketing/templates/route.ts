import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { isMarketingAuthorized } from "@/lib/marketing-auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isMarketingAuthorized(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const templates = await prisma.marketingTemplate.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching marketing templates:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isMarketingAuthorized(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!name || !content) {
      return NextResponse.json(
        { error: "Nombre y contenido son obligatorios" },
        { status: 400 }
      );
    }

    if (name.length > 80) {
      return NextResponse.json(
        { error: "El nombre no puede superar 80 caracteres" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "El contenido es demasiado largo" },
        { status: 400 }
      );
    }

    const template = await prisma.marketingTemplate.create({
      data: {
        name,
        content,
        createdById: session.user.id,
      },
      select: {
        id: true,
        name: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error creating marketing template:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
