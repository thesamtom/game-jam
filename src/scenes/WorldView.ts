import Phaser from 'phaser';
import { TILE_SIZE, validTile } from '../data/tiles';
import type { Layout } from '../data/maps/layout';

export function renderWorld(scene: Phaser.Scene, layout: Layout) {
  const { cols, rows } = layout;
  const width = cols * TILE_SIZE;
  const height = rows * TILE_SIZE;
  const textureKey = 'world:' + scene.scene.key;
  let texture = scene.textures.exists(textureKey) ? scene.textures.get(textureKey) as Phaser.Textures.CanvasTexture : null;
  if (!texture) {
    texture = scene.textures.createCanvas(textureKey, width, height);
    if (!texture) throw new Error('Could not allocate town canvas');
    const ctx = texture.context;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = layout.ground;
    ctx.fillRect(0, 0, width, height);
    for (let y = 2; y < height; y += 5) for (let x = 2; x < width; x += 7) {
      const n = (x * 73 + y * 57 + x * y * 3) % 31;
      if (n < 8) {
        ctx.fillStyle = n < 4 ? '#ffffff' : '#000000';
        ctx.globalAlpha = .07;
        ctx.fillRect(x + n % 4, y + n % 3, 1 + n % 3, 1);
      }
    }
    ctx.globalAlpha = 1;
    for (const patch of layout.patches) {
      const { x, y, w, h } = patch;
      ctx.fillStyle = patch.color;
      ctx.fillRect(x * 16, y * 16, w * 16, h * 16);
      if (!patch.detail) continue;
      ctx.fillStyle = patch.detail;
      for (let row = 0; row < h * 16 - 5; row += 8) {
        for (let col = (row % 16 ? 6 : 2); col < w * 16 - 8; col += 12) {
          ctx.fillRect(x * 16 + col, y * 16 + row + 4, 6, 1);
        }
      }
    }
    const source = scene.textures.get('city').getSourceImage() as CanvasImageSource;
    for (const entry of layout.art) {
      if (entry.above) continue;
      entry.stamp.forEach((row, dy) => row.forEach((tile, dx) => {
        if (!validTile(tile)) return;
        ctx.drawImage(source, tile % 12 * 16, Math.floor(tile / 12) * 16, 16, 16,
          (entry.x + dx) * 16, (entry.y + dy) * 16, 16, 16);
      }));
    }
    texture.refresh();
  }
  scene.add.image(0, 0, textureKey).setOrigin(0).setDepth(-100);
  for (const entry of layout.art) {
    if (!entry.above) continue;
    const base = (entry.y + entry.stamp.length) * 16 - 4;
    entry.stamp.forEach((row, dy) => row.forEach((tile, dx) => {
      if (validTile(tile)) scene.add.image((entry.x + dx) * 16, (entry.y + dy) * 16, 'city', tile).setOrigin(0).setDepth(base);
    }));
  }
  renderLampPools(scene, layout);
  for (const sign of layout.signs) {
    scene.add.text(sign.x * 16, sign.y * 16, sign.text, {
      fontFamily: '"Noto Sans Malayalam", system-ui, sans-serif', fontSize: '6px', resolution: 2, fontStyle: 'bold',
      color: sign.color, backgroundColor: '#253139', padding: { x: 2, y: 1 }
    }).setOrigin(.5).setDepth(5000);
  }
  const obstacles = scene.physics.add.staticGroup();
  for (const { x, y, w, h } of layout.solids) {
    const bounds = scene.add.zone((x + w / 2) * 16, (y + h / 2) * 16, w * 16, h * 16);
    obstacles.add(bounds);
  }
  scene.physics.world.setBounds(0, 0, width, height);
  scene.cameras.main.setBounds(0, 0, width, height).setZoom(3).setRoundPixels(true);
  return obstacles;
}

function renderLampPools(scene: Phaser.Scene, layout: Layout) {
  if (!scene.textures.exists('lamplight')) {
    const texture = scene.textures.createCanvas('lamplight', 70, 70)!;
    const ctx = texture.context;
    const light = ctx.createRadialGradient(35, 35, 1, 35, 35, 34);
    light.addColorStop(0, 'rgba(250, 201, 115, .24)');
    light.addColorStop(.45, 'rgba(250, 190, 101, .12)');
    light.addColorStop(1, 'rgba(244, 169, 100, 0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 70, 70);
    texture.refresh();
  }
  for (const lamp of layout.lamps) scene.add.image(lamp.x, lamp.y + 13, 'lamplight').setDepth(-51);
}
