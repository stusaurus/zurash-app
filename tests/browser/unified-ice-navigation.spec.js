import { test, expect } from '@playwright/test';

// Dedicated visual-shell regression: no puzzle state, rewards or saves are changed.
for (const width of [320, 390]) {
  for (const route of ['adventure.html', 'chapter-two.html', 'duel-boss.html']) {
    test(`ice navigation fits ${width}px on ${route}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 780 });
      // Chapter 2 intentionally hides its board until Chapter 1 is cleared.
      // Use the built-in independent trial route to inspect its actual layout.
      const url = route === 'chapter-two.html'
        ? '/chapter-two.html?trial=1&practice=1&stage=51'
        : '/' + route;
      await page.goto(url);
      const nav = page.locator('.zurash-route-nav').first();
      await expect(nav).toBeVisible();
      const links = nav.locator('a');
      await expect(links).toHaveCount(3);
      const bounds = await nav.evaluate((element) => {
        const navRect = element.getBoundingClientRect();
        const linkRects = [...element.querySelectorAll('a')]
          .filter((link) => link.getClientRects().length > 0)
          .map((link) => link.getBoundingClientRect());
        return {
          navLeft: navRect.left,
          navRight: navRect.right,
          linkRects: linkRects.map((rect) => ({ left: rect.left, right: rect.right, height: rect.height })),
        };
      });
      expect(bounds.navLeft).toBeGreaterThanOrEqual(-1);
      expect(bounds.navRight).toBeLessThanOrEqual(width + 1);
      expect(bounds.linkRects.length).toBeGreaterThanOrEqual(2);
      for (const rect of bounds.linkRects) {
        expect(rect.left).toBeGreaterThanOrEqual(bounds.navLeft - 1);
        expect(rect.right).toBeLessThanOrEqual(bounds.navRight + 1);
        expect(rect.height).toBeGreaterThanOrEqual(40);
      }
      await expect(nav.locator('a[aria-current="page"]')).toHaveCount(1);
      if (route === 'adventure.html') {
        // Fresh players have Chapter 2 locked. The remaining links should
        // occupy two equal columns, without an unused third column.
        await expect(nav.locator('#chapter-two-link')).toBeHidden();
        const columns = await nav.evaluate((el) =>
          getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length
        );
        expect(columns).toBe(2);
      }
      // The two puzzle modes must keep the actual game board on screen,
      // not merely the chapter navigation rail.
      const boardSelector = route === 'chapter-two.html'
        ? '#fun-board-viewport'
        : route === 'duel-boss.html' ? '.boss-board' : null;
      if (boardSelector) {
        const board = page.locator(boardSelector);
        await expect(board).toBeVisible();
        const box = await board.boundingBox();
        expect(box, `${route} board must have layout bounds`).not.toBeNull();
        expect(box.x, `${route} board left edge`).toBeGreaterThanOrEqual(-1);
        expect(box.x + box.width, `${route} board right edge`).toBeLessThanOrEqual(width + 1);
      }
      // Attach screenshots to the Playwright result itself, so passing tests
      // also retain visual evidence in the HTML report/artifact.
      await test.info().attach(`ice-v3-${route}-${width}`, {
        body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
        contentType: 'image/png',
      });
    });
  }
}
