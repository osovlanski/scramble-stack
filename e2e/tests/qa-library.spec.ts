import { test, expect } from '@playwright/test';
import { QA_URL } from '../playwright.config';

test.describe('System Design Q&A library', () => {
  test('library page renders with question cards', async ({ page }) => {
    await page.goto(QA_URL);
    await expect(page).toHaveURL(new RegExp(QA_URL));
    const card = page.getByRole('article').first().or(page.getByRole('link', { name: /question|design/i }).first());
    await expect(card).toBeVisible({ timeout: 10_000 });
  });
});
