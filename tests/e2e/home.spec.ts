import { test, expect } from '@playwright/test';

test('home redirects to first seeded space', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/spaces\/[0-9a-f-]+$/);
});
