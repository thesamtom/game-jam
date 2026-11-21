import { expect, test } from '@playwright/test';
import { at, drain, go, start, state } from './helpers';

test('New Game introduces every character before the chapter briefing or save', async ({ page }) => {
  await page.goto('/?fast');
  await page.getByRole('button', { name: 'New Game' }).click();
  const roster = page.getByRole('dialog', { name: 'MEET THE PEOPLE OF KARIMKUNNU' });
  await expect(roster).toBeVisible();
  const characters = roster.locator('.character-card');
  await expect(characters).toHaveCount(8);
  const names = await characters.locator('h3').allTextContents();
  expect(names).toEqual(['Alex', 'Vishnu', 'Kuttappan', 'Dr. Meera', 'SP Raghavan', 'CI Hamsa', 'Shaji', 'Sudhi']);
  expect(await characters.locator('img').evaluateAll(images => new Set(images.map(image => (image as HTMLImageElement).src)).size)).toBe(8);
  await expect(characters.filter({ has: page.getByRole('heading', { name: 'Vishnu', exact: true }) })).toHaveText('VishnuA respected police officer.');
  await expect(characters.filter({ has: page.getByRole('heading', { name: 'Sudhi', exact: true }) })).toHaveText('SudhiA quiet police officer.');
  expect(await page.evaluate(() => localStorage.getItem('randu-chaaran:campaign'))).toBeNull();
  await page.screenshot({ path: '.qa/story-introductions-desktop.png' });

  await roster.getByRole('button', { name: 'Back to title' }).click();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  await page.getByRole('button', { name: 'New Game' }).click();
  await roster.getByRole('button', { name: 'Begin Story' }).click();
  const chapter = page.getByRole('dialog', { name: 'Chapter 1 — Two Spies' });
  await expect(chapter).toContainText('find out who in the police is warning Kuttappan');
  await expect(chapter).toContainText('Meet SP Raghavan at the police station');
  const before = await state(page);
  await page.keyboard.down('w');
  await page.waitForTimeout(130);
  await page.keyboard.up('w');
  expect((await state(page)).y).toBe(before.y);
  await expect(chapter).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(chapter).toBeVisible();
  await chapter.getByRole('button', { name: 'Start Chapter' }).click();
  await at(page, 'briefing');
});

test('dossier records the raid leak once shown and keeps Sudhi’s allegiance hidden', async ({ page }) => {
  await start(page, '?chapter=3&step=2&fast');
  await dossier();
  await expect(vishnu()).not.toContainText('warn Kuttappan');
  await expect(sudhi()).toContainText('A quiet police officer.');
  await page.getByRole('button', { name: 'Close', exact: true }).click();

  await go(page, 'van');
  await page.keyboard.press('e');
  await expect(page.locator('.dialogue')).toBeVisible();
  await drain(page);
  await expect(page.locator('.dialogue .speaker')).toContainText('Vishnu');
  await drain(page);
  await expect(page.getByRole('dialog', { name: 'Chapter 4 — The Hunt' })).toContainText('Vishnu warned the gang');
  await at(page, 'tail');
  await dossier();
  await expect(vishnu()).toContainText('You saw Vishnu warn Kuttappan');
  await expect(sudhi()).toContainText('A quiet police officer.');

  function vishnu() {
    return page.locator('.character-card').filter({ has: page.getByRole('heading', { name: 'Vishnu', exact: true }) });
  }
  function sudhi() {
    return page.locator('.character-card').filter({ has: page.getByRole('heading', { name: 'Sudhi', exact: true }) });
  }
  async function dossier() {
    await page.keyboard.press('j');
    await page.getByRole('button', { name: 'People', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Character Dossier' })).toBeVisible();
  }
});
