import { expect, test } from '@playwright/test';
import { at, go, start } from './helpers';
test('message, empty van, parallel warning, and raid are playable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await start(page, '?chapter=3&fast');
  await go(page, 'phone');
  await page.keyboard.press('e');
  await expect(page.locator('.dialogue.phone')).toBeVisible();
  await fastForward();
  await go(page, 'yardGate');
  await at(page, 'van');
  await go(page, 'van');
  await page.keyboard.press('e');
  await fastForward();
  await expect(page.locator('.dialogue')).toContainText('Vishnu');
  await fastForward();
  await at(page, 'tail');
  await start(page, '?chapter=6&fast');
  await go(page, 'raidRendezvous');
  await page.keyboard.press('e');
  await expect(page.locator('.dialogue')).toContainText('Vishnu');
  await fastForward();
  await expect(page.locator('.dialogue')).toContainText('Kuttappan');
  await fastForward();
  await at(page, 'survive');
  expect(errors).toEqual([]);

  async function fastForward() {
    for (let i = 0; i < 16; i++) {
      const active = await page.evaluate(() => window.randuTest!.advance());
      if (!active) break;
    }
  }
});
