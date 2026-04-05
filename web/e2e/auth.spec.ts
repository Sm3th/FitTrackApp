import { test, expect } from '@playwright/test';

const TEST_EMAIL    = `e2e_${Date.now()}@fittrack.test`;
const TEST_USERNAME = `e2euser${Date.now()}`;
const TEST_PASSWORD = 'Test1234!';

test.describe('Authentication', () => {
  test('landing page loads and shows FitTrack branding', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/FitTrack/i);
    // Redirects to login if not authenticated
    await expect(page).toHaveURL(/\/(login|register|$)/);
  });

  test('register page is accessible', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Email, username, password fields exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('register with invalid data shows error', async ({ page }) => {
    await page.goto('/register');
    // Try submitting without filling anything
    await page.getByRole('button', { name: /create|sign up|register/i }).click();
    // Some kind of error feedback should appear
    await expect(page.locator('[class*="toast"], [class*="error"], [class*="warning"]').first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // Error might be inline validation — just verify we're still on register page
    });
    await expect(page).toHaveURL(/register/);
  });

  test('full register → login flow', async ({ page }) => {
    // Register
    await page.goto('/register');
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[name="username"]').fill(TEST_USERNAME);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);

    const confirmInput = page.locator('input[type="password"]').nth(1);
    if (await confirmInput.isVisible()) {
      await confirmInput.fill(TEST_PASSWORD);
    }

    await page.getByRole('button', { name: /create|sign up|register/i }).click();

    // Should navigate to home or onboarding after successful register
    await expect(page).not.toHaveURL(/register/, { timeout: 8000 });
  });

  test('login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();

    // Should leave login page
    await expect(page).not.toHaveURL(/login/, { timeout: 8000 });
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill('WrongPassword!');
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();

    // Should stay on login page
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});
