import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isSalesPath,
  marketingModuleRedirect,
  marketingSalesRedirect,
  commercialRestrictedRedirect,
  ceoRouteRedirect,
  ceoDashboardRedirect,
  COMMERCIAL_BLOCKED_PREFIXES,
} from "../lib/rbac-routes.js";
import {
  canAccessCommercialCrm,
  canAccessTasksCalendar,
  canAccessCeoDashboard,
  canAccessFinance,
  canAccessHr,
  isCommercial,
  isAdministration,
} from "../lib/permissions.js";

test("sales paths incluyen módulos comerciales", () => {
  assert.ok(isSalesPath("/leads"));
  assert.ok(isSalesPath("/leads/abc"));
  assert.ok(isSalesPath("/presupuestos/nuevo"));
  assert.ok(isSalesPath("/ceo"));
  assert.ok(!isSalesPath("/marketing"));
  assert.ok(!isSalesPath("/login"));
});

test("marketing no accede a rutas comerciales", () => {
  assert.equal(marketingSalesRedirect("MARKETING", "/leads"), "/marketing");
  assert.equal(marketingSalesRedirect("ADMIN", "/leads"), null);
  assert.equal(marketingSalesRedirect("COMMERCIAL", "/leads"), null);
});

test("solo admin y marketing acceden al módulo marketing", () => {
  assert.equal(marketingModuleRedirect("MEMBER", "/marketing"), "/dashboard");
  assert.equal(marketingModuleRedirect("COMMERCIAL", "/marketing"), "/dashboard");
  assert.equal(marketingModuleRedirect("MARKETING", "/marketing"), null);
  assert.equal(marketingModuleRedirect("ADMIN", "/marketing/create"), null);
});

test("COMMERCIAL no accede a tareas, calendario ni importación", () => {
  for (const prefix of COMMERCIAL_BLOCKED_PREFIXES) {
    assert.equal(
      commercialRestrictedRedirect("COMMERCIAL", prefix),
      "/dashboard",
      prefix
    );
    assert.equal(
      commercialRestrictedRedirect("COMMERCIAL", `${prefix}/extra`),
      "/dashboard",
      `${prefix}/extra`
    );
  }
  assert.equal(commercialRestrictedRedirect("MEMBER", "/tasks"), null);
  assert.equal(commercialRestrictedRedirect("ADMIN", "/calendar"), null);
});

test("rutas CEO: panel, finanzas y RRHH", () => {
  assert.equal(ceoRouteRedirect("ADMIN", "/ceo"), null);
  assert.equal(ceoRouteRedirect("ADMIN", "/ceo/finanzas"), null);
  assert.equal(ceoRouteRedirect("ADMIN", "/ceo/rrhh"), null);
  assert.equal(ceoRouteRedirect("FINANCE", "/ceo/finanzas"), null);
  assert.equal(ceoRouteRedirect("FINANCE", "/ceo"), "/ceo/finanzas");
  assert.equal(ceoRouteRedirect("FINANCE", "/ceo/rrhh"), "/dashboard");
  assert.equal(ceoRouteRedirect("MANAGER", "/ceo/finanzas"), "/dashboard");
  assert.equal(ceoRouteRedirect("MANAGER", "/ceo"), "/dashboard");
  assert.equal(ceoDashboardRedirect("ADMIN", "/ceo"), null);
});

test("permisos rol COMMERCIAL", () => {
  const commercial = { user: { role: "COMMERCIAL", id: "u1" } };
  assert.ok(isCommercial(commercial));
  assert.ok(canAccessCommercialCrm(commercial));
  assert.ok(!canAccessTasksCalendar(commercial));
  assert.ok(!canAccessCeoDashboard(commercial));
  assert.ok(!canAccessFinance(commercial));
});

test("permisos rol ADMINISTRATION (ops sin finanzas)", () => {
  const adminOps = { user: { role: "ADMINISTRATION", id: "u2" } };
  assert.ok(isAdministration(adminOps));
  assert.ok(canAccessCommercialCrm(adminOps));
  assert.ok(canAccessTasksCalendar(adminOps));
  assert.ok(!canAccessCeoDashboard(adminOps));
  assert.ok(!canAccessFinance(adminOps));
  assert.ok(!canAccessHr(adminOps));
});

test("permisos rol FINANCE", () => {
  const finance = { user: { role: "FINANCE", id: "u3" } };
  assert.ok(canAccessFinance(finance));
  assert.ok(!canAccessHr(finance));
  assert.ok(!canAccessCeoDashboard(finance));
  assert.ok(!canAccessCommercialCrm(finance));
});
