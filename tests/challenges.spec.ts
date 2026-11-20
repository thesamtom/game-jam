import { expect, test } from '@playwright/test';
import { at, start, state } from './helpers';

test('dead drops are unique and record their seeded reward', async ({ page }) => {
  await start(page, '?fast');
  await at(page, 'briefing');
  await page.evaluate(() => window.randuTest!.fieldPlace('drop-station'));
  await expect(page.getByRole('button', { name: /Open Station Wall Envelope/ })).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.getByText(/Dead drop opened/)).toBeVisible();
  const record = (await state(page)).field;
  expect(record.achievements).toContain('drop');
  expect(record.envelopes['drop-station']).toBeTruthy();
  await page.reload();
  await page.getByRole('button', { name: 'Continue' }).click();
  await at(page, 'briefing');
  await page.evaluate(() => window.randuTest!.fieldPlace('drop-station'));
  await expect(page.getByRole('button', { name: /Open Station Wall Envelope/ })).toBeHidden();
  expect((await state(page)).field.envelopes).toEqual(record.envelopes);
  expect((await state(page)).field.xp).toBe(record.xp);
});

test('observation challenge scores, saves an achievement and replays outside the campaign', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await start(page, '?fast');
  await at(page, 'briefing');
  await page.keyboard.press('j');
  await page.getByRole('button', { name: 'Records', exact: true }).click();
  await page.getByRole('button', { name: 'Start Crossing Watch' }).click();
  await complete();
  await at(page, 'briefing');
  expect((await state(page)).field.achievements).toContain('observation');
  expect((await state(page)).field.records.observation.grade).toBe('S');
  const campaignAfterFirst = await page.evaluate(() => localStorage.getItem('randu-chaaran:campaign'));
  await page.keyboard.press('j');
  await page.getByRole('button', { name: 'Records', exact: true }).click();
  await page.getByRole('button', { name: 'Replay Crossing Watch' }).click();
  await complete();
  await at(page, 'briefing');
  expect(await page.evaluate(() => localStorage.getItem('randu-chaaran:campaign'))).toBe(campaignAfterFirst);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Return to title' }).click();
  const before = await page.evaluate(() => localStorage.getItem('randu-chaaran:campaign'));
  await page.getByRole('button', { name: 'Challenge Records' }).click();
  await expect(page.getByText('Local leaderboard')).toBeVisible();
  await page.getByRole('button', { name: 'Replay Crossing Watch' }).click();
  await page.getByRole('button', { name: 'Begin challenge' }).click();
  await page.evaluate(() => window.challengeTest!.place('street'));
  await page.getByRole('button', { name: /Inspect detail/ }).click();
  await expect(page.getByRole('heading', { name: 'Try again' })).toBeVisible();
  await page.getByRole('button', { name: 'Return', exact: true }).click();
  await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('randu-chaaran:campaign'))).toBe(before);
  expect(errors).toEqual([]);

  async function complete() {
    await page.getByRole('button', { name: 'Begin challenge' }).click();
    for (const clue of ['clock', 'tracks', 'chalk']) {
      await page.evaluate(id => window.challengeTest!.place(id), clue);
      await expect(page.getByRole('button', { name: /Inspect detail/ })).toBeVisible();
      await page.keyboard.press('e');
    }
    await expect(page.getByRole('heading', { name: 'Rank S' })).toBeVisible();
    await page.getByRole('button', { name: 'Return', exact: true }).click();
  }
});
