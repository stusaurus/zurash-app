import { test, expect } from '@playwright/test';

test('locked Chapter 2 offers clear practice entrance', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/chapter-two.html');

  await expect(page.locator('#fun-title')).toHaveText('第2章はまだロック中');
  const entry = page.locator('#chapter-two-try-now');
  await expect(entry).toBeVisible();
  await expect(entry).toHaveAttribute('href', './chapter-two.html?trial=1&practice=1&stage=51');

  await entry.click();
  await expect(page).toHaveURL(/chapter-two\.html\?trial=1&practice=1&stage=51/);
  await expect(page.locator('#fun-board-viewport')).toBeVisible();
  await expect(page.locator('#fun-board .cell').first()).toBeVisible();
});

test('normal Chapter 2 still explains its campaign unlock', async ({ page }) => {
  await page.goto('/chapter-two.html');
  await expect(page.locator('#fun-focus')).toContainText('第1章50面クリア');
  await expect(page.locator('#chapter-two-try-now')).toContainText('おためし');
});
