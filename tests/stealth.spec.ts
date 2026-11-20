import { expect, test } from '@playwright/test';
import { at, drain, go, start, state } from './helpers';

test('tail cone catches sustained exposure and restores a retry checkpoint', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await start(page, '?chapter=4&fast');
  const checkpoint = await state(page);
  await expect(page.locator('.suspicion')).toBeVisible();
  await page.evaluate(() => window.randuTest!.expose(true));
  await expect.poll(async () => (await state(page)).suspicion).toBeGreaterThan(.25);
  await expect.poll(async () => (await state(page)).retries).toBe(1);
  await page.evaluate(() => window.randuTest!.expose(false));
  const restored = await state(page);
  expect(Math.abs(restored.x - checkpoint.x)).toBeLessThan(1);
  await go(page, 'huntLayby');
  await expect.poll(async () => (await state(page)).tailReady, { timeout: 10000 }).toBe(true);
  await go(page, 'handoff');
  await expect(page.locator('.dialogue')).toContainText('Kuttappan', { timeout: 10000 });
  await drain(page);
  await at(page, 'clue');
  expect(errors).toEqual([]);
});

test('tower stairs and scripted rooftop fatality return Alex to the alley', async ({ page }) => {
  await start(page, '?chapter=5&fast');
  await go(page, 'roofDoor');
  await page.keyboard.press('e');
  await at(page, 'meet');
  expect((await state(page)).scene).toBe('Roof');
  await go(page, 'meeting');
  await page.keyboard.press('e');
  await expect(page.locator('.dialogue')).toContainText('Alex');
  await drain(page);
  await at(page, 'injured');
  expect((await state(page)).scene).toBe('Town');
});
