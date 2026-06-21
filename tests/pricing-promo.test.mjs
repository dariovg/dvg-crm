import { test } from "node:test";
import assert from "node:assert/strict";
import {
  firstMonthIaPrice,
  annualMonthlyPrice,
  annualUpfrontIaTotal,
  iaPackFirstMonthDiscountPercent,
  buildIaPackLineFields,
  FIRST_MONTH_IA_DISCOUNT_PERCENT,
} from "../lib/pricing-catalog.js";
import {
  computeLineTotal,
  formatLineDiscountLabel,
  hasIaFirstMonthPromo,
  computeQuoteSubtotal,
  computeQuoteTotalWithVat,
} from "../lib/quotes.js";
import { buildLinesFromTemplate } from "../lib/quote-templates.js";
import { catalogPriceForPack, packLineDescription } from "../lib/quotes.js";

test("firstMonthIaPrice applies 40% discount", () => {
  assert.equal(firstMonthIaPrice(349), 209);
  assert.equal(firstMonthIaPrice(297), 178);
});

test("annualUpfrontIaTotal: 11 meses −15% + mes 1 −15% y −40%", () => {
  assert.equal(annualMonthlyPrice(349), 297);
  assert.equal(annualUpfrontIaTotal(349), 178 + 297 * 11);
  assert.equal(annualUpfrontIaTotal(349), 3445);
  assert.equal(annualUpfrontIaTotal(949), 9361);
});

test("iaPackFirstMonthDiscountPercent for monthly and annual", () => {
  assert.equal(iaPackFirstMonthDiscountPercent("MONTHLY"), FIRST_MONTH_IA_DISCOUNT_PERCENT);
  assert.equal(iaPackFirstMonthDiscountPercent("ANNUAL"), FIRST_MONTH_IA_DISCOUNT_PERCENT);
});

test("buildLinesFromTemplate applies promo on IA pack for both billings", () => {
  const iaMonthly = buildLinesFromTemplate("IA", "MONTHLY", catalogPriceForPack, packLineDescription);
  const packM = iaMonthly.lines.find((l) => l.type === "PACK");
  assert.equal(packM.discountPercent, 40);

  const iaAnnual = buildLinesFromTemplate("IA", "ANNUAL", catalogPriceForPack, packLineDescription);
  const packA = iaAnnual.lines.find((l) => l.type === "PACK");
  assert.equal(packA.discountPercent, 40);
  assert.equal(packA.unitPrice, 807);

  const web = buildLinesFromTemplate("WEB", "MONTHLY", catalogPriceForPack, packLineDescription);
  assert.ok(web.lines.every((l) => !l.discountPercent));
});

test("computeLineTotal monthly IA first month", () => {
  const line = {
    type: "PACK",
    packId: "pro",
    quantity: 1,
    unitPrice: 949,
    discountPercent: 40,
  };
  assert.equal(computeLineTotal(line, "MONTHLY"), 569);
  assert.equal(formatLineDiscountLabel(line, "MONTHLY"), "Mes 1 −40%");
});

test("computeLineTotal annual IA upfront total", () => {
  const line = {
    type: "PACK",
    packId: "starter",
    quantity: 1,
    unitPrice: 297,
    discountPercent: 40,
  };
  assert.equal(computeLineTotal(line, "ANNUAL"), 3445);
  assert.equal(formatLineDiscountLabel(line, "ANNUAL"), "Mes 1 −40% (tarifa anual)");
  assert.equal(hasIaFirstMonthPromo([line]), true);
});

test("annual quote subtotal with IVA for Starter", () => {
  const lines = [
    {
      type: "PACK",
      packId: "starter",
      quantity: 1,
      unitPrice: 297,
      discountPercent: 40,
    },
  ];
  assert.equal(computeQuoteSubtotal(lines, "ANNUAL"), 3445);
  assert.equal(computeQuoteTotalWithVat({ billing: "ANNUAL", discountPercent: null }, lines), 4168);
});

test("buildIaPackLineFields annual includes promo", () => {
  const fields = buildIaPackLineFields("starter", "ANNUAL");
  assert.equal(fields.discountPercent, 40);
  assert.ok(fields.description.includes("pago único"));
});
