import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';

test('production uses the supplied Pixelta for DOM and Phaser canvas text', async ({ page }) => {
  const faults: string[] = [];
  page.on('pageerror', error => faults.push(error.message));
  page.on('console', message => { if (message.type() === 'error' || message.text().includes('Pixelta did not load')) faults.push(message.text()); });
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (value, x, y, maxWidth) {
      if (value.includes('TODDY SHOP')) document.documentElement.dataset.shopFont = this.font;
      if (value === 'Alex') document.documentElement.dataset.actorFont = this.font;
      if (maxWidth === undefined) original.call(this, value, x, y);
      else original.call(this, value, x, y, maxWidth);
    };
  });
  const fontResponse = page.waitForResponse(response => response.url().endsWith('/assets/fonts/Pixelta.ttf'));
  await page.goto('/');
  const heading = page.getByRole('heading', { name: 'Randu Chaaran' });
  await expect(heading).toBeVisible();
  const response = await fontResponse;
  expect(response.ok()).toBe(true);
  expect(createHash('sha256').update(await response.body()).digest('hex')).toBe('49f419470c0cf1b958000f353b9525b266ae7d21af21a25f31a7d15d7ec585a1');

  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument');
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.title-inner h1' });
  const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
  expect(fonts.some(font => font.familyName === 'Pixelta' && font.isCustomFont && font.glyphCount > 0)).toBe(true);
  await expect(page.locator('html')).toHaveAttribute('data-shop-font', /Pixelta/);
  await page.screenshot({ path: '.qa/pixelta-desktop-title.png' });

  await page.getByRole('button', { name: 'New Game' }).click();
  await expect(page.locator('.cinematic p')).toHaveCSS('font-family', /Pixelta/);
  await expect(page.locator('.cinematic .eyebrow')).toHaveCSS('font-family', /Pixelta/);
  await expect(page.locator('.objective strong')).toHaveText('Talk to SP Raghavan', { timeout: 8000 });
  await expect(page.locator('.objective strong')).toHaveCSS('font-family', /Pixelta/);
  await expect(page.getByRole('button', { name: /Speak to Raghavan/ })).toHaveCSS('font-family', /Pixelta/);

  await page.getByRole('button', { name: 'Case File' }).click();
  await expect(page.locator('.case-file h2')).toHaveCSS('font-family', /Pixelta/);
  await expect(page.locator('.case-file .file-meta')).toHaveCSS('font-family', /Pixelta/);
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('heading', { name: 'Paused' })).toHaveCSS('font-family', /Pixelta/);
  await page.getByRole('button', { name: 'Resume' }).click();

  await page.keyboard.press('e');
  await expect(page.locator('.speaker .eyebrow')).toHaveCSS('font-family', /Pixelta/);
  await expect(page.locator('.dialogue p')).toHaveCSS('font-family', /Pixelta/);
  await page.keyboard.press('Space');
  await expect(page.locator('.dialogue p')).toContainText('Three raids.');
  await page.keyboard.press('Space');
  await expect(page.locator('html')).toHaveAttribute('data-actor-font', /Pixelta/);
  await page.screenshot({ path: '.qa/pixelta-desktop-dialogue.png' });

  await page.goto('/');
  await page.getByRole('button', { name: 'Credits' }).click();
  await expect(page.locator('.credits-inner h1')).toHaveCSS('font-family', /Pixelta/);
  await expect(page.locator('.credits-inner dl')).toHaveCSS('font-family', /Pixelta/);
  expect(faults).toEqual([]);
});

test('Malayalam signage uses script fallback and has an English label when unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (value, x, y, maxWidth) {
      if (value.includes('TODDY SHOP')) document.documentElement.dataset.shopText = value;
      if (maxWidth === undefined) original.call(this, value, x, y);
      else original.call(this, value, x, y, maxWidth);
    };
    if (location.search !== '?no-local-font') return;
    const load = document.fonts.load.bind(document.fonts);
    document.fonts.load = (font, sample) => font.includes('Randu Malayalam') ? Promise.resolve([]) : load(font, sample);
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible();
  const fallback = await page.evaluate(() => Array.from(document.fonts).some(face =>
    face.family.includes('Randu Malayalam') && face.status === 'loaded'));
  await expect(page.locator('html')).toHaveAttribute('data-shop-text',
    fallback ? /[\u0D00-\u0D7F]+.*TODDY SHOP/ : 'TODDY SHOP');
  await page.goto('/?no-local-font');
  await expect(page.locator('html')).toHaveAttribute('data-shop-text', 'TODDY SHOP');
});
