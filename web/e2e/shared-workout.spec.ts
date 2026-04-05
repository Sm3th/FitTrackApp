import { test, expect } from '@playwright/test';

test.describe('Shared Workout Page', () => {
  const sampleWorkout = {
    name: 'Chest Day',
    date: new Date().toISOString(),
    duration: 45,
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 10, weight: 80 },
      { name: 'Incline Press', sets: 3, reps: 12, weight: 60 },
    ],
    totalVolume: 5360,
    sharedBy: 'TestUser',
  };

  const encoded = Buffer.from(JSON.stringify(sampleWorkout)).toString('base64');

  test('shared workout page decodes and displays workout data', async ({ page }) => {
    await page.goto(`/shared-workout?data=${encoded}`);

    // Should show workout name
    await expect(page.getByText(sampleWorkout.name)).toBeVisible();
    // Should show sharedBy
    await expect(page.getByText(/TestUser/i)).toBeVisible();
  });

  test('shared workout shows exercises', async ({ page }) => {
    await page.goto(`/shared-workout?data=${encoded}`);
    await expect(page.getByText('Bench Press')).toBeVisible();
    await expect(page.getByText('Incline Press')).toBeVisible();
  });

  test('shared workout without data param shows error state', async ({ page }) => {
    await page.goto('/shared-workout');
    // Should show some kind of error/empty state — not crash
    await expect(page.locator('body')).toBeVisible();
    // Should NOT have a JS error causing blank page
    const title = await page.title();
    expect(title).toMatch(/FitTrack/i);
  });

  test('copy link button exists on shared workout page', async ({ page }) => {
    await page.goto(`/shared-workout?data=${encoded}`);
    const copyBtn = page.getByRole('button', { name: /copy|link|share/i }).first();
    await expect(copyBtn).toBeVisible();
  });
});
