import { test, expect } from '@playwright/test';
import { CANVAS_URL, NEWS_FEED_URL, QA_URL } from '../playwright.config';

test.describe('Cross-app navigation via sidebar', () => {
  // TODO(e2e): hub is a tile grid, not a <nav> sidebar; selector needs update.
  test.fixme('sidebar icons link to the three apps', async ({ page }) => {
    await page.goto(CANVAS_URL);
    const sidebar = page.getByRole('navigation').or(page.locator('[data-testid="sidebar"]'));
    await expect(sidebar.first()).toBeVisible({ timeout: 5_000 });

    // collect outgoing links
    const links = await page.locator('a').evaluateAll(as => as.map(a => a.getAttribute('href')));
    expect(links.some(h => h?.includes(NEWS_FEED_URL) || h?.includes('news-feed') || h?.includes(':5174'))).toBeTruthy();
    expect(links.some(h => h?.includes(QA_URL) || h?.includes('system-design') || h?.includes(':5175'))).toBeTruthy();
  });
});
