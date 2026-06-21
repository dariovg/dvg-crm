import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIncomeFromQuote } from "../lib/finance-from-quote.js";

const lines = [{ quantity: 1, unitPrice: 1000, discountPercent: null }];

test("ingreso mensual recurrente con IVA", () => {
  const quote = {
    id: "q1",
    number: "PRE-2026-001",
    contactId: "c1",
    billing: "MONTHLY",
    projectType: "IA",
    discountPercent: null,
    contact: { name: "Acme" },
  };
  const draft = buildIncomeFromQuote(quote, lines);
  assert.equal(draft.type, "INCOME");
  assert.equal(draft.recurring, true);
  assert.equal(draft.amount, 1210);
  assert.equal(draft.categorySlug, "clientes-ia");
});

test("ingreso anual único (12 meses)", () => {
  const quote = {
    id: "q2",
    number: "PRE-2026-002",
    contactId: "c1",
    billing: "ANNUAL",
    projectType: "WEB",
    discountPercent: null,
    contact: { name: "Acme" },
  };
  const draft = buildIncomeFromQuote(quote, lines);
  assert.equal(draft.recurring, false);
  assert.equal(draft.amount, 1210 * 12);
  assert.equal(draft.categorySlug, "implementacion");
});
