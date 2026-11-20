import { expect, test, type Page } from '@playwright/test';
import { at, start, state } from './helpers';

test('escape challenge fails visibly, retries, and scores a successful exit', async ({ page }) => {
  await start(page, '?chapter=7&fast');
  await at(page, 'evidence');
  await launch(page, 'Service Gate Exit');
  await page.evaluate(() => window.challengeTest!.expose());
  await expect(page.getByRole('heading', { name: 'Try again' })).toBeVisible();
  await page.getByRole('button', { name: 'Retry challenge' }).click();
  await page.evaluate(() => window.challengeTest!.place('finish'));
  await expect(page.getByRole('heading', { name: /^Rank [CBAS]$/ })).toBeVisible();
  await page.getByRole('button', { name: 'Return', exact: true }).click();
  await at(page, 'evidence');
  expect((await state(page)).field.records.escape.detections).toBe(1);
  expect((await state(page)).field.records.escape.retries).toBe(1);
});

test('deduction accepts evidence-based choices and rejects unsupported conclusions', async ({ page }) => {
  await start(page, '?chapter=3&fast');
  await at(page, 'tip');
  await launch(page, 'Two Copies');
  await page.getByRole('button', { name: 'A specific officer altered the public page.' }).click();
  await expect(page.getByText(/Separate what the papers say/)).toBeVisible();
  await page.getByRole('button', { name: 'The posted copy omits one entry.' }).click();
  await expect(page.getByRole('heading', { name: /^Rank [AS]$/ })).toBeVisible();
  await page.getByRole('button', { name: 'Return', exact: true }).click();
  await at(page, 'tip');
  expect((await state(page)).field.records.deduction.clues).toBe(3);
});

test('shadow challenge follows the route using movement keys', async ({ page }) => {
  await start(page, '?chapter=5&fast');
  await at(page, 'towerIn');
  await launch(page, 'Behind the Annex');
  await page.keyboard.down('s');
  await page.waitForTimeout(1120);
  await page.keyboard.up('s');
  await page.waitForTimeout(4500);
  await page.keyboard.down('d');
  await expect(page.getByRole('heading', { name: /^Rank [AS]$/ })).toBeVisible({ timeout: 2000 });
  await page.keyboard.up('d');
  await page.getByRole('button', { name: 'Return', exact: true }).click();
  await at(page, 'towerIn');
  expect((await state(page)).field.records.shadow.detections).toBe(0);
});

async function launch(page: Page, title: string) {
  await page.keyboard.press('j');
  await page.getByRole('button', { name: 'Records', exact: true }).click();
  await page.getByRole('button', { name: 'Start ' + title }).click();
  await page.getByRole('button', { name: 'Begin challenge' }).click();
}
