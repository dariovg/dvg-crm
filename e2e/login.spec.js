import { test, expect } from "@playwright/test";

test.describe("Login", () => {
  test("la página de login carga y muestra el formulario", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /Tu panel de/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });
});
