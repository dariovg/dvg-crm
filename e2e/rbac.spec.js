import { test, expect } from "@playwright/test";

test.describe("RBAC (sin sesión)", () => {
  test("leads redirige a login si no hay sesión", async ({ page }) => {
    await page.goto("/leads");
    await expect(page).toHaveURL(/\/login/);
  });

  test("marketing redirige a login si no hay sesión", async ({ page }) => {
    await page.goto("/marketing");
    await expect(page).toHaveURL(/\/login/);
  });

  test("API marketing rechaza peticiones sin sesión", async ({ request }) => {
    const res = await request.get("/api/marketing/posts", { maxRedirects: 0 });
    if (res.status() === 401 || res.status() === 403) {
      expect([401, 403]).toContain(res.status());
      return;
    }
    expect([302, 307, 308]).toContain(res.status());
    expect(res.headers().location).toMatch(/\/login/);
  });
});
