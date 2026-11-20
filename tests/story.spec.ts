import { expect, test } from '@playwright/test';
import { start, drain, at, go, state } from './helpers';
test('briefing and all three market errands gate gang entry', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', event => { if (event.type() === 'error') errors.push(event.text()); });
  await start(page, '?fast');
  await at(page, 'briefing');
  await go(page, 'marketEntry');
  await at(page, 'briefing');
  await go(page, 'raghavan');
  await page.keyboard.press('e');
  await drain(page);
  await expect(page.locator('.dialogue')).toContainText('Kuttappan');
  await drain(page);
  await at(page, 'market');
  await go(page, 'marketEntry');
  await at(page, 'orders');
  for (const [id, point] of [['orders', 'shaji'], ['deliver', 'package'], ['pressure', 'shopkeeper'], ['collect', 'money'], ['accepted', 'kuttappan']]) {
    await at(page, id);
    await go(page, point);
    await page.keyboard.press('e');
    await drain(page);
  }
  await at(page, 'tip');
  const result = await state(page);
  expect(result.flags).toEqual(expect.arrayContaining(['briefing', 'deliver', 'pressure', 'collect', 'accepted']));
  expect(result.choices.pressure).toBe('quiet');
  expect(errors).toEqual([]);
});
