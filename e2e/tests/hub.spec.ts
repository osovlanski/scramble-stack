import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Hub page', () => {
  test('loads and shows all three app tiles', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/scramble|canvas|stack/i);
    await expect(page.getByText(/canvas/i).first()).toBeVisible();
    await expect(page.getByText(/news[ -]feed/i).first()).toBeVisible();
    await expect(page.getByText(/system design|interview/i).first()).toBeVisible();
  });

  test('has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
  });
});
