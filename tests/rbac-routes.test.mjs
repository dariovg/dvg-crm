import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isSalesPath,
  marketingModuleRedirect,
  marketingSalesRedirect,
  SALES_PREFIXES,
} from "../lib/rbac-routes.js";

test("sales paths incluyen módulos comerciales", () => {
  assert.ok(isSalesPath("/leads"));
  assert.ok(isSalesPath("/leads/abc"));
  assert.ok(isSalesPath("/presupuestos/nuevo"));
  assert.ok(!isSalesPath("/marketing"));
  assert.ok(!isSalesPath("/login"));
});

test("marketing no accede a rutas comerciales", () => {
  for (const prefix of SALES_PREFIXES) {
    assert.equal(
      marketingSalesRedirect("MARKETING", prefix),
      "/marketing",
      prefix
    );
  }
  assert.equal(marketingSalesRedirect("ADMIN", "/leads"), null);
  assert.equal(marketingSalesRedirect("MANAGER", "/leads"), null);
});

test("solo admin y marketing acceden al módulo marketing", () => {
  assert.equal(marketingModuleRedirect("MEMBER", "/marketing"), "/dashboard");
  assert.equal(marketingModuleRedirect("MANAGER", "/marketing/pending"), "/dashboard");
  assert.equal(marketingModuleRedirect("MARKETING", "/marketing"), null);
  assert.equal(marketingModuleRedirect("ADMIN", "/marketing/create"), null);
  assert.equal(marketingModuleRedirect("ADMIN", "/dashboard"), null);
});
