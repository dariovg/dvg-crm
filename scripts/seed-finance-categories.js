#!/usr/bin/env node
/**
 * Categorías base de finanzas (gastos e ingresos).
 * Uso: node scripts/seed-finance-categories.js
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: "nominas", name: "Nóminas", type: "EXPENSE", sortOrder: 1 },
  { slug: "infra", name: "Infraestructura", type: "EXPENSE", sortOrder: 2 },
  { slug: "saas", name: "SaaS", type: "EXPENSE", sortOrder: 3 },
  { slug: "marketing", name: "Marketing", type: "EXPENSE", sortOrder: 4 },
  { slug: "legal", name: "Legal", type: "EXPENSE", sortOrder: 5 },
  { slug: "otros-gasto", name: "Otros (gasto)", type: "EXPENSE", sortOrder: 6 },
  { slug: "clientes-ia", name: "Clientes IA", type: "INCOME", sortOrder: 1 },
  { slug: "implementacion", name: "Implementación", type: "INCOME", sortOrder: 2 },
  { slug: "otros-ingreso", name: "Otros (ingreso)", type: "INCOME", sortOrder: 3 },
];

async function main() {
  for (const cat of CATEGORIES) {
    await prisma.financeCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, type: cat.type, sortOrder: cat.sortOrder },
      create: cat,
    });
  }
  console.log(`Categorías de finanzas: ${CATEGORIES.length} listas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
