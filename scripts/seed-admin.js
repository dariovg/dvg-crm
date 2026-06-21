#!/usr/bin/env node
/**
 * Crea o actualiza el usuario admin con contraseña hasheada.
 * Uso: CRM_ADMIN_EMAIL=... CRM_ADMIN_PASSWORD=... node scripts/seed-admin.js
 * (No guardes la contraseña en claro en .env — solo para este comando puntual.)
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const DEFAULT_ADMIN_NAME = "DVG CEO";

async function main() {
  const email = (process.env.CRM_ADMIN_EMAIL || "info@dvgsstudio.com")
    .trim()
    .toLowerCase();
  const plain = process.env.CRM_ADMIN_PASSWORD;

  if (!plain) {
    console.error("Define CRM_ADMIN_PASSWORD para generar el hash (solo en terminal).");
    console.error("Ejemplo: CRM_ADMIN_PASSWORD='tu-pass' node scripts/seed-admin.js");
    process.exit(1);
  }

  const passwordHash = bcrypt.hashSync(plain, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", name: DEFAULT_ADMIN_NAME },
    create: {
      email,
      passwordHash,
      role: "ADMIN",
      name: DEFAULT_ADMIN_NAME,
    },
  });

  console.log("Admin listo:", user.email);
  console.log("");
  console.log("Añade a Vercel / .env.local (sin la contraseña en claro):");
  console.log(`CRM_ADMIN_EMAIL=${email}`);
  console.log(`CRM_ADMIN_PASSWORD_HASH=${passwordHash}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
