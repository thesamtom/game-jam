import { expect, test, type Page } from '@playwright/test';
import { maps } from '../src/data/maps';
import { chapters, type Place } from '../src/data/chapters';
import { safePosition } from '../src/systems/Save';
import { at, start, state } from './helpers';

test('all quest targets and chapter spawns are connected by passable paths', () => {
  for (const scene of ['Town', 'Roof', 'Park'] as const) {
    const layout = maps[scene];
    const grid = 4;
    const seed = Object.values(layout.marks)[0];
    const first = [Math.round(seed.x / grid), Math.round(seed.y / grid)];
    const key = (x: number, y: number) => y * (layout.cols * 4 + 1) + x;
    const visited = new Set([key(first[0], first[1])]);
    const queue = [first];
    for (let i = 0; i < queue.length; i++) {
      const [x, y] = queue[i];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (visited.has(key(nx, ny)) || !safePosition(scene, { x: nx * grid, y: ny * grid })) continue;
        visited.add(key(nx, ny));
        queue.push([nx, ny]);
      }
    }
    for (const chapter of chapters) {
      const required = targetsIn(scene, chapter);
      for (const name of required) {
        const point = layout.marks[name];
        expect(point, scene + '/' + name).toBeDefined();
        expect.soft(safePosition(scene, point), scene + '/' + name).toBe(true);
        const nearby = queue.some(([x, y]) => Math.hypot(x * grid - point.x, y * grid - point.y) < 9);
        expect.soft(nearby, scene + '/' + name).toBe(true);
      }
    }
  }
});

function targetsIn(scene: Place, chapter: typeof chapters[number]) {
  const marks: string[] = chapter.startScene === scene ? [chapter.checkpoint] : [];
  for (const step of chapter.objectives) {
    if (step.scene !== scene) continue;
    if (step.spawn) marks.push(step.spawn);
    if (step.at) marks.push(step.at);
  }
  return marks;
}

test('both stealth passages can be cleared using movement keys', async ({ page }) => {
  test.setTimeout(30000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await start(page, '?chapter=4&fast');
  await at(page, 'tail');
  await hold(page, 's', s => s.y > 327);
  await expect.poll(async () => (await state(page)).tailReady, { timeout: 10000 }).toBe(true);
  await page.screenshot({ path: '.qa/desktop-tail.png' });
  await hold(page, 'd', s => s.busy || s.x > 515);
  await expect(page.getByText('Kuttappan', { exact: true })).toBeVisible();
  expect((await state(page)).retries).toBe(0);

  await start(page, '?chapter=6&step=1&fast');
  await at(page, 'survive');
  await hold(page, 'a', s => s.x < 445 || s.busy || s.objective !== 'survive');
  const yard = await state(page);
  if (yard.objective === 'survive' && !yard.busy) {
    await hold(page, 's', s => s.y > 518 || s.busy || s.objective !== 'survive');
  }
  await at(page, 'evidence');
  expect(errors).toEqual([]);
});

async function hold(page: Page, key: string, reached: (value: Awaited<ReturnType<typeof state>>) => boolean) {
  await page.keyboard.down(key);
  try {
    await expect.poll(async () => reached(await state(page)), { intervals: [30, 45, 60], timeout: 5500 }).toBe(true);
  } finally {
    await page.keyboard.up(key);
  }
}
