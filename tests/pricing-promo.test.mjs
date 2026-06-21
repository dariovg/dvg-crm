import { test } from "node:test";
import assert from "node:assert/strict";
import {
  firstMonthIaPrice,
  annualMonthlyPrice,
  annualUpfrontIaTotal,
  buildIaFirstMonthLine,
  buildIaRegularMonthLine,
  buildDefaultIaPackLines,
  isIaFirstMonthLine,
  FIRST_MONTH_IA_DISCOUNT_PERCENT,
} from "../lib/pricing-catalog.js";
import {
  computeLineTotal,
  formatLineDiscountLabel,
  hasIaFirstMonthPromo,
  computeQuoteSubtotal,
  computeQuoteTotalWithVat,
  countIaContractMonths,
} from "../lib/quotes.js";
import { buildLinesFromTemplate } from "../lib/quote-templates.js";
import { catalogPriceForPack, packLineDescription } from "../lib/quotes.js";

test("firstMonthIaPrice applies 40% discount", () => {
  assert.equal(firstMonthIaPrice(349), 209);
  assert.equal(firstMonthIaPrice(297), 178);
});

test("annualUpfrontIaTotal via separate lines", () => {
  assert.equal(annualMonthlyPrice(349), 297);
  const lines = [
    buildIaFirstMonthLine("starter", "ANNUAL"),
    buildIaRegularMonthLine("starter", "ANNUAL", 11),
  ];
  assert.equal(computeQuoteSubtotal(lines, "ANNUAL"), annualUpfrontIaTotal(349));
  assert.equal(computeQuoteSubtotal(lines, "ANNUAL"), 3445);
});

test("buildDefaultIaPackLines creates mes 1 + meses normales", () => {
  const lines = buildDefaultIaPackLines("pro", "MONTHLY");
  assert.equal(lines.length, 2);
  assert.equal(isIaFirstMonthLine(lines[0]), true);
  assert.equal(lines[0].discountPercent, 40);
  assert.equal(lines[1].quantity, 2);
  assert.equal(lines[1].discountPercent, null);
});

test("buildLinesFromTemplate IA adds mes 1 + 2 meses normales", () => {
  const ia = buildLinesFromTemplate("IA", "MONTHLY", catalogPriceForPack, packLineDescription);
  assert.equal(ia.lines.length, 2);
  assert.equal(isIaFirstMonthLine(ia.lines[0]), true);
  assert.equal(ia.lines[1].quantity, 2);

  const web = buildLinesFromTemplate("WEB", "MONTHLY", catalogPriceForPack, packLineDescription);
  assert.ok(web.lines.every((l) => !l.discountPercent));
});

test("4 month starter contract: 1 mes 1 + 3 mes normal", () => {
  const lines = [
    buildIaFirstMonthLine("starter", "MONTHLY"),
    buildIaRegularMonthLine("starter", "MONTHLY", 3),
  ];
  assert.equal(countIaContractMonths(lines), 4);
  assert.equal(computeQuoteSubtotal(lines, "MONTHLY"), 209 + 349 * 3);
  assert.equal(computeQuoteTotalWithVat({ billing: "MONTHLY", discountPercent: null }, lines), 1520);
});

test("computeLineTotal per line with discount", () => {
  const line = buildIaFirstMonthLine("pro", "MONTHLY");
  assert.equal(computeLineTotal(line, "MONTHLY"), 569);
  assert.equal(formatLineDiscountLabel(line, "MONTHLY"), "Mes 1 −40%");
  assert.equal(hasIaFirstMonthPromo([line]), true);
});

test("annual mes 1 line is single month with discount on annual rate", () => {
  const line = buildIaFirstMonthLine("starter", "ANNUAL");
  assert.equal(line.unitPrice, 297);
  assert.equal(computeLineTotal(line, "ANNUAL"), 178);
  assert.equal(formatLineDiscountLabel(line, "ANNUAL"), "Mes 1 −40% (tarifa anual)");
});
