import { test, expect } from "@playwright/test";
import path from "node:path";

test.describe("sources upload UI", () => {
  test("drop zone shows help copy and accepts file input", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Sources" }).click();
    await expect(page.getByText(/Supported: PDF/i)).toBeVisible();
    await expect(page.getByText(/50 MB per file/i)).toBeVisible();
    await expect(page.getByText(/add more files while uploads/i)).toBeVisible();

    const fixture = path.join(__dirname, "fixtures", "sample.txt");
    await page.getByTestId("upload-file-input").setInputFiles(fixture);
    // Slice 3 adds toast assertion; here only verify input is interactive
    await expect(page.getByTestId("upload-drop-zone")).toBeVisible();
  });

  test("selecting one file shows progress toast to completion", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Sources" }).click();
    const fixture = path.join(__dirname, "fixtures", "sample.txt");
    await page.getByTestId("upload-file-input").setInputFiles(fixture);

    await expect(page.getByText("sample.txt")).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Upload progress" })).toBeVisible();
    await expect(page.getByLabel("Upload complete")).toBeVisible({ timeout: 6000 });
  });

  test("multiple files produce concurrent toasts", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Sources" }).click();

    const a = path.join(__dirname, "fixtures", "a.txt");
    const b = path.join(__dirname, "fixtures", "b.txt");
    await page.getByTestId("upload-file-input").setInputFiles([a, b]);

    await expect(page.getByText("a.txt")).toBeVisible();
    await expect(page.getByText("b.txt")).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveCount(2);

    // Drop zone still accepts input while uploads run
    await page.getByTestId("upload-file-input").setInputFiles(a);
    await expect(page.getByText("a.txt")).toHaveCount(2);
  });
});
