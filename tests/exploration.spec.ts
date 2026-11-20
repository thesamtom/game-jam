import { expect, test } from '@playwright/test';
import { at, start, state } from './helpers';

test('landmark discovery is optional and survives Continue', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await start(page, '?fast');
  await at(page, 'briefing');
  await page.evaluate(() => window.randuTest!.fieldPlace('police-plaque'));
  await expect(page.getByRole('button', { name: /Inspect Police Station Plaque/ })).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.getByRole('heading', { name: 'Police Station Plaque' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to town' }).click();
  await at(page, 'briefing');
  const before = await state(page);
  expect(before.field.xp).toBeGreaterThanOrEqual(53);
  expect(before.field.discoveries).toContain('police-plaque');
  expect(before.field.districts).toContain('police-quarter');
  await page.reload();
  await page.getByRole('button', { name: 'Continue' }).click();
  await at(page, 'briefing');
  expect((await state(page)).field.discoveries).toEqual(before.field.discoveries);
  expect(errors).toEqual([]);
});
