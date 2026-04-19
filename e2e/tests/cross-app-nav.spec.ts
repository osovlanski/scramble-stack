import { test, expect } from '@playwright/test';
import { CANVAS_URL } from '../playwright.config';

test.describe('Cross-app navigation via sidebar', () => {
  test('sidebar exposes nav entries for all three apps', async ({ page }) => {
    await page.goto(CANVAS_URL);

    const sidebar = page.getByRole('navigation').first();
    await expect(sidebar).toBeVisible({ timeout: 5_000 });

    // Sidebar renders an icon-only button per app, using the `title` attribute
    // as the accessible label. In CI the VITE_NEWS_FEED_URL / VITE_SYSTEM_DESIGN_URL
    // envs are wired by docker-compose, so the labels don't include "(coming soon)".
    await expect(sidebar.getByTitle(/^canvas$/i)).toBeVisible();
    await expect(sidebar.getByTitle(/^news feed/i)).toBeVisible();
    await expect(sidebar.getByTitle(/^system design q&a/i)).toBeVisible();
  });
});
