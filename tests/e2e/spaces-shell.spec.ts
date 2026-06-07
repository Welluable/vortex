import { test, expect } from "@playwright/test";

test.describe("space shell", () => {
  test("switcher shows seeded space name after redirect", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Acme Corp/i })).toBeVisible();
  });

  test("switching space updates URL and trigger label", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Acme Corp/i }).click();
    await page.getByRole("menuitem", { name: "Side Project" }).click();
    await expect(page).toHaveURL(/\/spaces\/[0-9a-f-]+$/);
    await expect(page.getByRole("button", { name: /Side Project/i })).toBeVisible();
  });

  test("mobile viewport opens sidebar sheet", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.getByRole("button", { name: /toggle sidebar/i }).click();
    await expect(page.getByRole("button", { name: /Acme Corp/i })).toBeVisible();
  });
});
