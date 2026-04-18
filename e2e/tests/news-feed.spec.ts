import { test, expect } from '@playwright/test';
import { NEWS_FEED_URL } from '../playwright.config';

test.describe('News feed', () => {
  test('loads without 5xx and shows at least one article or empty-state', async ({ page }) => {
    const response = await page.goto(NEWS_FEED_URL);
    expect(response?.status() ?? 200).toBeLessThan(500);
    const signal = page.getByRole('article').first().or(page.getByText(/no articles|empty|loading/i).first());
    await expect(signal).toBeVisible({ timeout: 10_000 });
  });
});
