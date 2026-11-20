import Phaser from 'phaser';
import { TILE } from '../data/tiles';
import type { Point } from '../data/maps/layout';

export const CAST = {
  Alex: { name: 'Alex', tile: TILE.boy, tint: '#ffc383', outline: '#291f27' },
  Vishnu: { name: 'Vishnu', tile: TILE.officer, tint: '#83bfc9', outline: '#172b37' },
  Kuttappan: { name: 'Kuttappan', tile: TILE.boy, tint: '#fff0c5', outline: '#35212a' },
  Shaji: { name: 'Shaji', tile: TILE.boy, tint: '#977fbb', outline: '#281d35' },
  Meera: { name: 'Dr. Meera', tile: TILE.girl, tint: '#dfafa8', outline: '#30202c' },
  Raghavan: { name: 'SP Raghavan', tile: TILE.officer, tint: '#e4be91', outline: '#36282b' },
  Hamsa: { name: 'CI Hamsa', tile: TILE.officer, tint: '#a8ca8e', outline: '#223034' },
  Sudhi: { name: 'Sudhi', tile: TILE.officer, tint: '#b49bc4', outline: '#302738' }
} as const;
export type Character = keyof typeof CAST;
export type Appearance = Character | 'Young Vishnu' | 'Unknown Officer';

export function actorTexture(scene: Phaser.Scene, appearance: Appearance): string {
  const key = 'actor:' + appearance;
  if (scene.textures.exists(key)) return key;
  const style = CAST[appearance === 'Young Vishnu' ? 'Alex' : appearance === 'Unknown Officer' ? 'Vishnu' : appearance];
  const texture = scene.textures.createCanvas(key, 16, 16)!;
  const ctx = texture.context;
  const tile = style.tile;
  ctx.drawImage(scene.textures.get('city').getSourceImage() as CanvasImageSource,
    (tile % 12) * 16, Math.floor(tile / 12) * 16, 16, 16, 0, 0, 16, 16);
  const colors = ctx.getImageData(0, 0, 16, 16);
  const rgb = [1, 3, 5].map(offset => parseInt(style.tint.slice(offset, offset + 2), 16));
  const outline = [1, 3, 5].map(offset => parseInt(style.outline.slice(offset, offset + 2), 16));
  const data = colors.data;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const value = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const x = (i / 4) % 16;
    const y = Math.floor(i / 64);
    const concealed = appearance === 'Unknown Officer' && y >= 5 && y <= 12 && data[i] > data[i + 2] + 18;
    for (let c = 0; c < 3; c++) {
      if (value < 75) data[i + c] = outline[c];
      else if (appearance === 'Kuttappan' && y >= 10 && x > 2 && x < 14) data[i + c] = value * .38 + rgb[c] * .57;
      else if (concealed) data[i + c] = [65, 76, 94][c];
      else data[i + c] = data[i + c] * .72 + rgb[c] * .28;
    }
  }
  ctx.putImageData(colors, 0, 0);
  texture.refresh();
  return key;
}
export class Npc {
  readonly image: Phaser.GameObjects.Image;
  readonly label: Phaser.GameObjects.Text;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  constructor(scene: Phaser.Scene, readonly name: Appearance, public point: Point, showName = false) {
    this.shadow = scene.add.ellipse(point.x, point.y, 13, 5, 0x192125, .54);
    this.image = scene.add.image(point.x, point.y, actorTexture(scene, name)).setOrigin(.5, .85);
    this.label = scene.add.text(point.x, point.y - 17, name in CAST ? CAST[name as Character].name : name,
      { fontSize: 8, resolution: 2, color: '#f9e5b7', stroke: '#1b2530', strokeThickness: 2 })
      .setOrigin(.5, 1).setDepth(4000).setVisible(showName);
    this.update(0);
  }
  update(time: number) {
    const { x, y } = this.point;
    this.shadow.setPosition(Math.round(x), Math.round(y) + 1).setDepth(y);
    this.image.setPosition(Math.round(x), Math.round(y)).setDepth(y + 1).setScale(1, 1 + Math.sin(time / 500 + x) * .025);
    this.label.setPosition(Math.round(x), Math.round(y) - 15);
  }
  destroy() { this.image.destroy(); this.shadow.destroy(); this.label.destroy(); }
}
