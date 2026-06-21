import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { uploadProfileImage, isProfileBlobConfigured } from "@/lib/profile-storage";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId || userId === "env-admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!isProfileBlobConfigured()) {
    return NextResponse.json(
      { error: "Almacenamiento no configurado (Blob en Vercel)." },
      { status: 503 }
    );
  }

  let form;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
  }

  const file = form.get("photo");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Falta la imagen" }, { status: 400 });
  }

  try {
    const url = await uploadProfileImage(userId, file);
    await prisma.user.update({
      where: { id: userId },
      data: { image: url },
    });
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Error al subir" },
      { status: 400 }
    );
  }
}
