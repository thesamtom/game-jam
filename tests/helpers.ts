import { expect, type Page } from '@playwright/test';

export const state = (page: Page) => page.evaluate(() => window.render_game_to_text ? JSON.parse(window.render_game_to_text()) : null);
export async function start(page: Page, parameters = '') {
  await page.goto('/' + parameters);
  await page.getByRole('button', { name: 'New Game' }).click();
  await expect(page.locator('.objective')).toBeVisible();
}
export async function skip(page: Page) {
  await page.evaluate(() => window.randuTest!.advance());
}
export async function place(page: Page, mark: string) {
  await page.evaluate(mark => window.randuTest!.place(mark), mark);
}
export async function go(page: Page, mark: string) {
  await place(page, mark);
  await page.waitForTimeout(85);
}
export async function at(page: Page, id: string) {
  await expect.poll(async () => (await state(page))?.objective).toBe(id);
}
export async function drain(page: Page, through = 50) {
  for (let i = 0; i < through; i++) {
    const result = await page.evaluate(() => window.randuTest!.advance());
    if (!result) break;
    if (result === 'choice') await page.locator('.choices button').last().click();
  }
}
