// Verify the theme toggle updates the site and persists the selected theme.
import { test, expect } from '@playwright/test';

test.describe('Theme toggle', () => {
  test('switches themes and remembers the selection after reload', async ({ page }) => {
    await page.goto('/');

    const themeToggle = page.getByTestId('theme-toggle');
    const root = page.locator('html');
    const body = page.locator('body');
    const firstGameCard = page.getByTestId('game-card').first();

    await expect(root).toHaveClass(/dark/);
    await expect(themeToggle).toHaveAccessibleName('Switch to light mode');
    await themeToggle.click();

    await expect(root).not.toHaveClass(/dark/);
    await expect(themeToggle).toHaveAccessibleName('Switch to dark mode');
    await expect(themeToggle).toHaveAttribute('aria-pressed', 'false');
    const lightBodyBackground = await body.evaluate((element) => getComputedStyle(element).backgroundColor);
    const lightCardBackground = await firstGameCard.evaluate((element) => getComputedStyle(element).backgroundColor);

    await page.reload();
    await expect(root).not.toHaveClass(/dark/);
    await expect(themeToggle).toHaveAccessibleName('Switch to dark mode');

    await themeToggle.click();
    await expect(root).toHaveClass(/dark/);
    await expect(themeToggle).toHaveAttribute('aria-pressed', 'true');
    const darkBodyBackground = await body.evaluate((element) => getComputedStyle(element).backgroundColor);
    const darkCardBackground = await firstGameCard.evaluate((element) => getComputedStyle(element).backgroundColor);

    expect(darkBodyBackground).not.toBe(lightBodyBackground);
    expect(darkCardBackground).not.toBe(lightCardBackground);
  });
});
