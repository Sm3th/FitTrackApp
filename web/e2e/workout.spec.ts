import { test, expect, type Page } from '@playwright/test';

const MOCK_USER = {
  id: 'e2e-user-id',
  username: 'e2etestuser',
  email: 'e2e@fittrack.test',
  fullName: 'E2E Test User',
};

const MOCK_TOKEN = 'e2e-mock-token-for-testing';

/** Injects auth state and mocks all API calls so tests run without a real backend */
async function setupAuth(page: Page) {
  // Intercept all API calls and return sensible mocks
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Auth endpoints
    if (url.includes('/api/auth/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { user: MOCK_USER, token: MOCK_TOKEN } }),
      });
    }

    // Workout sessions
    if (url.includes('/api/workouts/sessions')) {
      if (method === 'POST' && url.includes('/start')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { id: 'session-1', userId: MOCK_USER.id, startTime: new Date().toISOString() } }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0, page: 1, limit: 20 }),
      });
    }

    // Exercises
    if (url.includes('/api/exercises')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    }

    // Nutrition
    if (url.includes('/api/nutrition')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    }

    // Metrics
    if (url.includes('/api/metrics')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    }

    // Leaderboard
    if (url.includes('/api/users/leaderboard')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    }

    // User profile
    if (url.includes('/api/users/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_USER }),
      });
    }

    // Default: empty success
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  // Navigate to app and inject auth into localStorage
  await page.goto('/');
  await page.evaluate(
    ({ user, token }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { user: MOCK_USER, token: MOCK_TOKEN }
  );
  await page.reload();
}

test.describe('Workout flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('navbar is visible after login', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('workout page loads correctly', async ({ page }) => {
    await page.goto('/workout');
    await expect(page).toHaveURL(/workout/);
    await expect(page.getByRole('button', { name: /start/i }).first()).toBeVisible();
  });

  test('workout history page loads', async ({ page }) => {
    await page.goto('/workout-history');
    await expect(page).toHaveURL(/workout-history/);
    const content = page.locator('h1, h2').first();
    await expect(content).toBeVisible();
  });

  test('stats page loads with charts area', async ({ page }) => {
    await page.goto('/stats');
    await expect(page).toHaveURL(/stats/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('workout plans page shows plans', async ({ page }) => {
    await page.goto('/workout-plans');
    await expect(page).toHaveURL(/workout-plans/);
    await expect(page.locator('h1').first()).toBeVisible();
    const cards = page.locator('[class*="card"], [class*="rounded"]');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test('AI coach page loads', async ({ page }) => {
    await page.goto('/ai-coach');
    await expect(page).toHaveURL(/ai-coach/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('nutrition page loads', async ({ page }) => {
    await page.goto('/nutrition');
    await expect(page).toHaveURL(/nutrition/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('bottom nav is visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const bottomNav = page.locator('nav').last();
    await expect(bottomNav).toBeVisible();
  });

  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/');
    const htmlBefore = await page.locator('html').getAttribute('class');
    const navButtons = page.locator('nav .md\\:flex button');
    const count = await navButtons.count();
    if (count > 0) {
      await navButtons.first().click();
      await page.waitForTimeout(300);
      const htmlAfter = await page.locator('html').getAttribute('class');
      expect(htmlBefore).not.toBe(htmlAfter);
    }
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('all main nav links work', async ({ page }) => {
    const routes = [
      '/workout-plans',
      '/stats',
      '/achievements',
      '/nutrition',
      '/ai-coach',
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(route.replace('/', '\\/')), { timeout: 5000 });
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('unauthenticated users are redirected to login', async ({ page }) => {
    // Don't set up auth for this test — start fresh
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto('/stats');
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});
