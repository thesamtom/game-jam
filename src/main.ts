import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TileDebugScene } from './scenes/TileDebugScene';
import { TitleScene } from './scenes/TitleScene';
import { TownScene } from './scenes/TownScene';
import { RoofScene } from './scenes/RoofScene';
import { UIScene } from './scenes/UIScene';
import { ParkScene } from './scenes/ParkScene';
import { FieldParkScene, FieldRoofScene } from './scenes/FieldDestinations';
import { ChallengeScene } from './scenes/ChallengeScene';
import { CreditsScene } from './scenes/CreditsScene';
import './style.css';
import { loadTypography } from './typography';

void loadTypography().then(() => new Phaser.Game({
  type: Phaser.CANVAS, parent: 'game', backgroundColor: '#17252a',
  pixelArt: true, roundPixels: true,
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BootScene, TileDebugScene, TitleScene, TownScene, RoofScene, ParkScene, UIScene, CreditsScene, ChallengeScene, FieldParkScene, FieldRoofScene]
}));
