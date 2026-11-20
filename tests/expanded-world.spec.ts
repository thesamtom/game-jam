import { expect, test } from '@playwright/test';
import { activities } from '../src/data/activities';
import { challenges } from '../src/data/challenges';
import { chapters } from '../src/data/chapters';
import { discoveries } from '../src/data/discoveries';
import { safePosition } from '../src/systems/Save';
import { at, go, start, state } from './helpers';

test('optional entries and challenge routes use walkable terrain', () => {
  for (const site of discoveries) expect.soft(safePosition(site.scene, site.at), site.id).toBe(true);
  for (const activity of activities) {
    expect.soft(safePosition('Town', activity.lead.at), activity.id + ' lead').toBe(true);
    expect.soft(safePosition('Town', activity.comparison.at), activity.id + ' comparison').toBe(true);
  }
  for (const mission of challenges) {
    for (const point of [mission.start, ...(mission.finish ? [mission.finish] : []), ...(mission.patrol ?? []), ...(mission.observations?.map(note => note.at) ?? [])]) {
      expect.soft(safePosition('Town', point), mission.id + ' ' + JSON.stringify(point)).toBe(true);
    }
  }
});

test('early park visit keeps the current objective and opens a new destination', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await start(page, '?fast');
  await at(page, 'briefing');
  await go(page, 'parkPath');
  await expect(page.getByRole('button', { name: /Visit Town Park/ })).toBeVisible();
  await page.keyboard.press('e');
  await at(page, 'free-roam');
  expect((await state(page)).scene).toBe('Park');
  await page.evaluate(() => window.randuTest!.fieldPlace('park-etching'));
  await expect(page.getByRole('button', { name: /Inspect Bench Inscription/ })).toBeVisible();
  await page.keyboard.press('e');
  await page.getByRole('button', { name: 'Back to town' }).click();
  await go(page, 'entry');
  await expect(page.getByRole('button', { name: /Back to Karimkunnu/ })).toBeVisible();
  await page.keyboard.press('e');
  await at(page, 'briefing');
  expect((await state(page)).field.discoveries).toContain('park-etching');
  expect(errors).toEqual([]);
});

test('a legacy rooftop checkpoint migrates without losing the objective or identity', async ({ page }) => {
  const flags = chapters.slice(0, 7).flatMap(chapter => chapter.completionConditions)
    .concat(chapters[7].completionConditions.slice(0, 2));
  await page.addInitScript(flags => {
    if (localStorage.getItem('randu-chaaran:campaign')) return;
    localStorage.setItem('randu-chaaran:campaign', JSON.stringify({
      version: 1, scene: 'Roof', finished: false, muted: false,
      campaign: { chapter: 8, objective: 2, flags, choices: { pressure: 'firm' }, identity: 'Vishnu' }
    }));
  }, flags);
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue' }).click();
  await at(page, 'roofExit');
  const restored = await state(page);
  expect(restored.identity).toBe('Vishnu');
  expect(restored.flags).toEqual(flags);
  expect(restored.choices.pressure).toBe('firm');
  expect(restored.field.xp).toBeGreaterThan(400);
  expect(restored.field.town).toBe('Aftermath');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('randu-chaaran:campaign')!).version)).toBe(2);
});

test('all eleven investigations can be solved and earned trust opens the market challenge', async ({ page }) => {
  test.setTimeout(30000);
  const flags = chapters.slice(0, 8).flatMap(chapter => chapter.completionConditions)
    .concat(chapters[8].completionConditions.slice(0, 3));
  await page.addInitScript(flags => {
    localStorage.setItem('randu-chaaran:campaign', JSON.stringify({
      version: 1, scene: 'Town', finished: false, muted: false,
      campaign: { chapter: 9, objective: 3, flags, choices: { pressure: 'quiet' }, identity: 'Vishnu' }
    }));
  }, flags);
  await page.goto('/?fast');
  await page.getByRole('button', { name: 'Continue' }).click();
  await at(page, 'home');
  await page.keyboard.press('j');
  await page.getByRole('button', { name: 'Records', exact: true }).click();
  await expect(page.getByText(/Signal Lamp Survey opens at 45 Gang Trust/)).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  for (const activity of activities) {
    const entry = page.getByRole('button', { name: 'E · Investigate ' + activity.name, exact: true });
    await page.evaluate(id => window.randuTest!.fieldPlace(id + ':lead'), activity.id);
    await entry.click();
    await page.getByRole('button', { name: 'Back to town' }).click();
    await page.evaluate(id => window.randuTest!.fieldPlace(id + ':comparison'), activity.id);
    await entry.click();
    await page.getByRole('button', { name: activity.answers[activity.correct], exact: true }).click();
    await expect(page.getByText(/Investigation solved/)).toBeVisible();
    await page.getByRole('button', { name: 'Back to town' }).click();
  }
  const result = await state(page);
  expect(result.flags).toEqual(flags);
  expect(result.field.investigation).toBe(11);
  expect(result.field.achievements).toContain('investigator');
  expect(result.field.trust).toBeGreaterThanOrEqual(45);
  await page.keyboard.press('j');
  await page.getByRole('button', { name: 'Records', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start Signal Lamp Survey' })).toBeVisible();
});

test('later story events reopen leads and restore the changed town after reload', async ({ page }) => {
  await start(page, '?chapter=7&fast');
  await at(page, 'evidence');
  expect((await state(page)).field.town).toBe('Crackdown');
  await page.keyboard.press('j');
  await expect(page.getByText(/Crackdown ·/)).toBeVisible();
  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await expect(page.getByText(/A Missing Seal · Goods Yard/)).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Continue' }).click();
  await at(page, 'evidence');
  expect((await state(page)).field.town).toBe('Crackdown');
});
