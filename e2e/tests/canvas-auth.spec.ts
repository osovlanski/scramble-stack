import { test, expect } from '@playwright/test';

test.describe('Canvas auth flow', () => {
  test('unauthenticated user can reach hub but diagrams redirects to login', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/canvas/i).first()).toBeVisible();

    await page.goto('/canvas');
    // either a login form appears or an auth CTA — both are acceptable exits
    const loginInput = page.locator('input[type="email"], input[name*="email" i], input[name*="user" i]').first();
    const loginCta = page.getByRole('link', { name: /sign in|log in/i }).first();
    await expect(loginInput.or(loginCta)).toBeVisible({ timeout: 5000 });
  });
});
