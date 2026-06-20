import { test, expect } from "@playwright/test";

test.describe("Publicar post (smoke)", () => {
  test("POST publish sin sesión no permite publicar", async ({ request }) => {
    const res = await request.post("/api/marketing/posts/e2e-fake-id/publish", {
      maxRedirects: 0,
    });
    if (res.status() === 401) {
      const body = await res.json();
      expect(body.error).toBeTruthy();
      return;
    }
    expect([302, 307, 308]).toContain(res.status());
    expect(res.headers().location).toMatch(/\/login/);
  });

  test("health expone versión y estado de base de datos", async ({ request }) => {
    const res = await request.get("/api/health");
    expect([200, 503]).toContain(res.status());

    const body = await res.json();
    expect(body.service).toBe("dvg-crm");
    expect(body.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(["up", "down"]).toContain(body.database);
    expect(typeof body.ok).toBe("boolean");
  });
});
