import { expect, test } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('Landing page loads', async ({ page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
    await expect(page.locator('body')).toContainText(/Zypflow/i);
  });

  test('Login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test('Signup page loads', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test('Pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('body')).toContainText(/price|plan|month|£|\$/i);
  });

  test('Audit page loads', async ({ page }) => {
    await page.goto('/audit');
    await expect(
      page.locator('input[type="url"], input[name="url"], input[placeholder*="url" i], input[placeholder*="website" i], input[placeholder*="domain" i]')
    ).toBeVisible();
  });

  test('Health check', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
  });

  test('Dashboard redirects unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('Widget iframe loads', async ({ page }) => {
    const response = await page.goto('/widget/test-org-id');
    expect(response).not.toBeNull();
    // The page should render something — either the widget or an error state
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Terms page loads', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('body')).toContainText(/terms|conditions|agreement|legal/i);
  });

  test('Privacy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('body')).toContainText(/privacy|data|personal information/i);
  });
});
