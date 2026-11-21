import { expect, test } from '@playwright/test';
import { at, start, state } from './helpers';

test('optional investigation records evidence, accepts a correction and updates the Case File', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await start(page, '?fast');
  await at(page, 'briefing');
  await page.keyboard.press('j');
  await expect(page.getByRole('heading', { name: 'Case File' })).toBeVisible();
  await page.getByRole('button', { name: 'People', exact: true }).click();
  await expect(page.locator('.character-card')).toHaveCount(8);
  await expect(page.getByRole('heading', { name: 'Sudhi', exact: true })).toBeVisible();
  await expect(page.getByText('A quiet police officer.', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await visit('lead');
  await expect(page.getByText('Optional investigation · Lead recorded')).toBeVisible();
  await page.getByRole('button', { name: 'Back to town' }).click();
  await visit('comparison');
  await page.getByRole('button', { name: 'The board was never filled out.' }).click();
  await expect(page.getByText(/Look for what both notes actually support/)).toBeVisible();
  await page.getByRole('button', { name: 'A line was removed from the posted board.' }).click();
  await expect(page.getByText(/Investigation solved/)).toBeVisible();
  await page.getByRole('button', { name: 'Back to town' }).click();
  await page.keyboard.press('j');
  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await expect(page.getByText('The schedule existed. Only the public copy has a gap.')).toBeVisible();
  await page.getByRole('button', { name: 'Records', exact: true }).click();
  await page.screenshot({ path: '.qa/expanded-case-desktop.png' });
  await page.getByRole('button', { name: 'Turn field notifications off' }).click();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  expect((await state(page)).field.activities['duty-gap']).toEqual(['lead','solved']);
  expect((await state(page)).field.quiet).toBe(true);
  await at(page, 'briefing');
  expect(errors).toEqual([]);

  async function visit(stage: string) {
    await page.evaluate(stage => window.randuTest!.fieldPlace('duty-gap:' + stage), stage);
    await expect(page.getByRole('button', { name: /Investigate A Gap in the Duty Board/ })).toBeVisible();
    await page.keyboard.press('e');
  }
});
