import { test, expect } from '@playwright/test';

test('home page shows Vortex heading', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'Vortex' })).toBeVisible();
});
