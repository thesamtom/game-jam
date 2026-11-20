import { expect, test } from '@playwright/test';

test('built browser game loads local assets and omits development hooks', async ({ page }) => {
  const faults: string[] = [];
  const origins = new Set<string>();
  page.on('pageerror', error => faults.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error') faults.push(msg.text()); });
  page.on('request', req => origins.add(new URL(req.url()).origin));
  await page.goto('/?tiles&chapter=9&fast');
  await expect(page.getByRole('heading', { name: 'Randu Chaaran' })).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await page.screenshot({ path: '.qa/title-production.png' });
  await page.getByRole('button', { name: 'New Game' }).click();
  await expect(page.getByText('CHAPTER 1 — TWO SPIES', { exact: true })).toBeVisible();
  await expect(page.locator('.objective strong')).toHaveText('Talk to SP Raghavan', { timeout: 8000 });
  await page.keyboard.press('e');
  await expect(page.locator('.dialogue')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.locator('.dialogue p')).toContainText('Three raids.');
  const globals = await page.evaluate(() => ({
    test: 'randuTest' in window,
    snapshot: 'render_game_to_text' in window
  }));
  expect(globals).toEqual({ test: false, snapshot: false });
  expect([...origins]).toEqual(['http://127.0.0.1:4188']);
  expect(faults).toEqual([]);
});
