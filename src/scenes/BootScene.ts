import Phaser from 'phaser';
import { SHEET, TILE_SIZE } from '../data/tiles';
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    this.load.spritesheet('city', import.meta.env.BASE_URL + 'assets/kenney/Tilemap/tilemap_packed.png', {
      frameWidth: TILE_SIZE, frameHeight: TILE_SIZE, spacing: 0, margin: 0
    });
  }
  create() {
    const source = this.textures.get('city').getSourceImage();
    if (source.width !== SHEET.width || source.height !== SHEET.height || !this.textures.get('city').has('131')) {
      throw new Error('The Kenney packed sheet must contain 132 tiles at 16 × 16 pixels.');
    }
    this.scene.launch('UI');
    const debug = import.meta.env.DEV && new URLSearchParams(location.search).has('tiles');
    this.scene.start(debug ? 'TileDebug' : 'Title');
  }
}
