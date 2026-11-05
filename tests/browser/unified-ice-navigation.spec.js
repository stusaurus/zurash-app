import { test, expect } from '@playwright/test';

// Dedicated visual-shell regression: no puzzle state, rewards or saves are changed.
for (const width of [320, 390]) {
  for (const route of ['adventure.html', 'chapter-two.html', 'duel-boss.html']) {
    test(`ice navigation fits ${width}px on ${route}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 780 });
      await page.goto('/' + route);
      const nav = page.locator('.zurash-route-nav').first();
      await expect(nav).toBeVisible();
      const links = nav.locator('a');
      await expect(links).toHaveCount(3);
      const bounds = await nav.evaluate((element) => {
        const navRect = element.getBoundingClientRect();
        const linkRects = [...element.querySelectorAll('a')].map((link) => link.getBoundingClientRect());
        return {
          navLeft: navRect.left,
          navRight: navRect.right,
          linkRects: linkRects.map((rect) => ({ left: rect.left, right: rect.right, height: rect.height })),
        };
      });
      expect(bounds.navLeft).toBeGreaterThanOrEqual(-1);
      expect(bounds.navRight).toBeLessThanOrEqual(width + 1);
      for (const rect of bounds.linkRects) {
        expect(rect.left).toBeGreaterThanOrEqual(bounds.navLeft - 1);
        expect(rect.right).toBeLessThanOrEqual(bounds.navRight + 1);
        expect(rect.height).toBeGreaterThanOrEqual(40);
      }
      await expect(nav.locator('a[aria-current="page"]')).toHaveCount(1);
      // Capture the rendered page for side-by-side visual inspection in CI artifacts.
      // This does not replace human visual approval or real-device testing.
      await page.screenshot({
        path: `test-results/ice-v3-${route.replace('.html', '')}-${width}-${test.info().project.name}.png`,
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
}
