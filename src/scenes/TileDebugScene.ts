import Phaser from 'phaser';
import { SHEET } from '../data/tiles';
export class TileDebugScene extends Phaser.Scene {
  constructor() { super('TileDebug'); }
  create() {
    const zoom = Math.max(1, Math.min(3, Math.floor(this.scale.width / (SHEET.columns * 22)), Math.floor((this.scale.height - 35) / (SHEET.rows * 23))));
    const pitch = 22 * zoom;
    const start = Math.max(pitch / 2, (this.scale.width - SHEET.columns * pitch) / 2 + pitch / 2);
    this.cameras.main.setBackgroundColor('#28323a');
    this.add.text(12, 8, 'TINY CITY  /  132 PACKED FRAMES  /  ESC TO TITLE', { fontSize: '12px', color: '#f5dba8' });
    for (let i = 0; i < SHEET.frames; i++) {
      const x = start + (i % SHEET.columns) * pitch;
      const y = 35 + Math.floor(i / SHEET.columns) * 23 * zoom;
      this.add.rectangle(x, y, 17 * zoom, 17 * zoom, i % 2 ? 0xb3abb1 : 0x787680);
      this.add.image(x, y, 'city', i).setScale(zoom);
      this.add.text(x, y + 8 * zoom, String(i), { fontSize: '9px', color: '#ffffff' }).setOrigin(0.5, 0);
    }
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('Title'));
    if (import.meta.env.DEV) window.dispatchEvent(new CustomEvent('tile-ready', { detail: SHEET.frames }));
  }
}
