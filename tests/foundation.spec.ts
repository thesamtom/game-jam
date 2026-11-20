import { expect, test } from '@playwright/test';
test('packed sheet and debug scene load in the browser', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => window.addEventListener('tile-ready', event => {
    document.documentElement.dataset.tiles = String((event as CustomEvent<number>).detail);
  }));
  await page.goto('/?tiles');
  await expect(page.locator('html')).toHaveAttribute('data-tiles', '132');
  await expect(page.locator('canvas')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('canvas')).toBeVisible();
  expect(errors).toEqual([]);
});
