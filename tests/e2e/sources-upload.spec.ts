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
});
