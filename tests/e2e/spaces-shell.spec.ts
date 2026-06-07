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

  test("nav links route to entities and facts", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Entities" }).click();
    await expect(page).toHaveURL(/\/entities$/);
    await page.getByRole("link", { name: "Facts" }).click();
    await expect(page).toHaveURL(/\/facts$/);
  });

  test("active nav item is styled on current route", async ({ page }) => {
    await page.goto("/");
    const entities = page.getByRole("link", { name: "Entities" });
    await entities.click();
    await expect(entities).toHaveClass(/font-medium/);
  });

  test("/spaces/new hides space-scoped nav", async ({ page }) => {
    await page.goto("/spaces/new");
    await expect(page.getByRole("link", { name: "Search" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Entities" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Facts" })).not.toBeVisible();
  });

  test("empty store redirects / to /spaces/new", async ({ page, request }) => {
    await request.post("/api/test/spaces", {
      headers: { "Content-Type": "application/json" },
      data: { action: "reset" },
    });
    try {
      await page.goto("/");
      await expect(page).toHaveURL("/spaces/new");
    } finally {
      await request.post("/api/test/spaces", {
        headers: { "Content-Type": "application/json" },
        data: { action: "restore" },
      });
    }
  });

  test("create space via form redirects with nav and switcher label", async ({ page }) => {
    await page.goto("/spaces/new");
    await page.getByLabel("Name").fill("E2E Space");
    await page.getByRole("button", { name: "Create space" }).click();
    await expect(page).toHaveURL(/\/spaces\/[0-9a-f-]+$/);
    await expect(page.getByRole("button", { name: /E2E Space/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Search" })).toBeVisible();
  });

  test("create space via dropdown menu item", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Acme Corp/i }).click();
    await page.getByRole("menuitem", { name: "Create space" }).click();
    await expect(page).toHaveURL("/spaces/new");
  });
});
