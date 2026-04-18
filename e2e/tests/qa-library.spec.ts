import { test, expect } from '@playwright/test';
import { QA_URL } from '../playwright.config';

test.describe('System Design Q&A library', () => {
  test('library page renders with seeded question cards', async ({ page }) => {
    await page.goto(QA_URL);
    await expect(page.getByRole('heading', { name: /system design q&a/i })).toBeVisible();

    // Backend auto-seeds via seedQuestionsIfEmpty() on startup; every seed title
    // begins with "Design ...". Cards render as buttons, not <article>s.
    const card = page.getByRole('button', { name: /^design /i }).first();
    await expect(card).toBeVisible({ timeout: 15_000 });
  });
});
