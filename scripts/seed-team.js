#!/usr/bin/env node
/**
 * Crea o actualiza miembros del equipo (rol MEMBER).
 * Uso: TEAM_EMAIL=juan@dvgsstudio.com TEAM_NAME=Juan TEAM_PASSWORD='...' node scripts/seed-team.js
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.TEAM_EMAIL || "").trim().toLowerCase();
  const name = (process.env.TEAM_NAME || "").trim();
  const plain = process.env.TEAM_PASSWORD;

  if (!email) {
    console.error("Define TEAM_EMAIL (ej. juan@dvgsstudio.com)");
    process.exit(1);
  }
  if (!plain) {
    console.error("Define TEAM_PASSWORD para el hash (solo en terminal).");
    process.exit(1);
  }

  const passwordHash = bcrypt.hashSync(plain, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "MEMBER", name: name || undefined },
    create: {
      email,
      passwordHash,
      role: "MEMBER",
      name: name || email.split("@")[0],
    },
  });

  console.log("Miembro listo:", user.email, `(${user.name})`);
  console.log("Rol:", user.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
