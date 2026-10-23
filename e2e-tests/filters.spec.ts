import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const strategyTitles: string[] = [
  'DevOps Dominion',
  'Pipeline Conquest',
  'Repo Rulers',
  'Server Siege',
];

const puzzleTitles: string[] = [
  'Bug Buster Brainteaser',
  'Code Puzzle Chronicles',
  'Merge Conflict Mystery',
  'Stack Trace Secrets',
];

test.describe('Catalog filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('form', { name: 'Filter games' })).toBeVisible();
  });

  test('matches any selected category and restores games when categories are unchecked', async ({ page }) => {
    const titles = page.getByTestId('game-card').filter({ visible: true }).getByTestId('game-title');
    const originalTitles = await titles.allTextContents();

    await test.step('Choose a category', async () => {
      await page.getByRole('checkbox', { name: 'Strategy', exact: true }).check();
      await expect(titles).toHaveText(strategyTitles);
      await expect(page.getByRole('status')).toHaveText('4 games shown');
    });

    await test.step('Choose another category to expand the results', async () => {
      await page.getByRole('checkbox', { name: 'Puzzle', exact: true }).check();
      await expect(titles).toHaveText([...strategyTitles, ...puzzleTitles].sort());
      await expect(page.getByRole('status')).toHaveText('8 games shown');
    });

    await test.step('Remove categories independently', async () => {
      await page.getByRole('checkbox', { name: 'Strategy', exact: true }).uncheck();
      await expect(titles).toHaveText(puzzleTitles);
      await page.getByRole('checkbox', { name: 'Puzzle', exact: true }).uncheck();
      await expect(titles).toHaveText(originalTitles);
    });
  });

  test('filters by publisher alone', async ({ page }) => {
    const titles = page.getByTestId('game-card').filter({ visible: true }).getByTestId('game-title');
    const originalTitles = await titles.allTextContents();

    await page.getByLabel('Publisher', { exact: true }).selectOption({ label: 'CodeForge Studios' });
    await expect(titles).toHaveText([
      'Cloud Conqueror',
      'Code Puzzle Chronicles',
      'Code Quest Odyssey',
      'DevOps Dominion',
      'Script Strike',
      'Virtual Server Simulator',
    ]);
    await expect(page.getByRole('status')).toHaveText('6 games shown');
    await page.getByLabel('Publisher', { exact: true }).selectOption('');
    await expect(titles).toHaveText(originalTitles);
  });

  test('combines categories and publisher, clears filters, and preserves game navigation', async ({ page }) => {
    const titles = page.getByTestId('game-card').filter({ visible: true }).getByTestId('game-title');
    const originalTitles = await titles.allTextContents();

    await test.step('Narrow category results by publisher', async () => {
      await page.getByRole('checkbox', { name: 'Strategy', exact: true }).check();
      await page.getByLabel('Publisher', { exact: true }).selectOption({ label: 'CodeForge Studios' });
      await expect(titles).toHaveText(['DevOps Dominion']);
      await expect(page.getByRole('status')).toHaveText('1 game shown');
      await page.getByRole('checkbox', { name: 'Puzzle', exact: true }).check();
      await expect(titles).toHaveText(['Code Puzzle Chronicles', 'DevOps Dominion']);
    });

    await test.step('Clear all controls and restore every game', async () => {
      await page.getByRole('button', { name: 'Clear filters' }).click();
      await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(0);
      await expect(page.getByLabel('Publisher', { exact: true })).toHaveValue('');
      await expect(titles).toHaveText(originalTitles);
      await expect(page.getByRole('status')).toHaveText(`${originalTitles.length} games shown`);
    });

    await test.step('Open a filtered game', async () => {
      await page.getByRole('checkbox', { name: 'Strategy', exact: true }).check();
      await page.getByRole('link').filter({ has: page.getByRole('heading', { name: 'DevOps Dominion', exact: true }) }).click();
      await expect(page.getByTestId('game-details-title')).toHaveText('DevOps Dominion');
    });
  });

  test('shows an empty state for a publisher without games and recovers on reset', async ({ page }) => {
    const cards = page.getByTestId('game-card').filter({ visible: true });
    const originalCount = await cards.count();
    const publisher = page.getByLabel('Publisher', { exact: true });

    // The seeded catalog covers every combination; model an unused publisher option.
    await publisher.evaluate((select: HTMLSelectElement) => {
      select.add(new Option('Publisher without games', '999999'));
    });
    await publisher.selectOption('999999');

    await expect(cards).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveText('0 games shown');
    await expect(page.getByTestId('empty-state')).toContainText('No games match your filters.');
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(cards).toHaveCount(originalCount);
    await expect(page.getByTestId('empty-state')).toBeHidden();
  });

  test('supports keyboard filtering, visible focus, and accessible filtered results', async ({ page }) => {
    const strategy = page.getByRole('checkbox', { name: 'Strategy', exact: true });
    const publisher = page.getByLabel('Publisher', { exact: true });
    const clear = page.getByRole('button', { name: 'Clear filters' });

    await test.step('Toggle a category with the keyboard', async () => {
      await strategy.focus();
      expect(await strategy.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe('none');
      await page.keyboard.press('Space');
      await expect(strategy).toBeChecked();
      await expect(page.getByRole('status')).toHaveText('4 games shown');
    });

    await test.step('Choose a publisher and reset using the keyboard', async () => {
      await publisher.focus();
      await page.keyboard.press('Home');
      await page.keyboard.press('ArrowDown');
      await expect(publisher).not.toHaveValue('');
      await expect(page.getByRole('status')).toHaveText('1 game shown');
      await page.keyboard.press('Tab');
      await expect(clear).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(strategy).not.toBeChecked();
      await expect(publisher).toHaveValue('');
    });

    await test.step('Check accessibility with filters active', async () => {
      await strategy.check();
      const scan = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(scan.violations).toEqual([]);
    });
  });

  test('works at mobile widths without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole('checkbox', { name: 'Puzzle', exact: true }).check();
    await page.getByLabel('Publisher', { exact: true }).selectOption({ label: 'CodeForge Studios' });
    await expect(page.getByTestId('game-card').filter({ visible: true }).getByTestId('game-title'))
      .toHaveText(['Code Puzzle Chronicles']);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});

test.describe('Catalog without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps the full catalog accessible without nonfunctional filter controls', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('form', { name: 'Filter games' })).toBeHidden();
    await expect(page.getByTestId('game-card').filter({ visible: true })).toHaveCount(21);
    await page.getByTestId('game-card').first().click();
    await expect(page.getByTestId('game-details-title')).not.toBeEmpty();
  });
});
