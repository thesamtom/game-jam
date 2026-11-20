import Phaser from 'phaser';
import { TILE } from '../data/tiles';
import type { Point } from '../data/maps/layout';
import { actorTexture } from './Npc';

export type Identity = 'Alex' | 'Vishnu';

export class Player {
  readonly anchor: Phaser.Physics.Arcade.Sprite;
  readonly actor: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly label: Phaser.GameObjects.Text;
  private distance = 0;
  private previousX: number;
  private previousY: number;
  private lastStep = 0;
  constructor(scene: Phaser.Scene, point: Point, public identity: Identity) {
    this.anchor = scene.physics.add.sprite(point.x, point.y, 'city', TILE.boy).setVisible(false).setCollideWorldBounds(true);
    this.anchor.setSize(9, 8).setOffset(3.5, 4);
    this.shadow = scene.add.ellipse(point.x, point.y, 13, 5, 0x172022, .58);
    this.actor = scene.add.image(point.x, point.y, actorTexture(scene, identity)).setOrigin(.5, .85);
    this.label = scene.add.text(point.x, point.y - 17, identity, {
      fontSize: '7px', resolution: 2, fontFamily: 'system-ui', fontStyle: 'bold', color: '#f9e5b7', stroke: '#1b2530', strokeThickness: 2
    }).setOrigin(.5, 1).setDepth(4000).setVisible(false);
    this.previousX = point.x;
    this.previousY = point.y;
  }
  get x() { return this.anchor.x; }
  get y() { return this.anchor.y; }
  stop() { this.anchor.setVelocity(0, 0); }
  showName(visible: boolean) { this.label.setVisible(visible && this.actor.visible); }
  setVisible(visible: boolean) {
    this.actor.setVisible(visible);
    this.shadow.setVisible(visible);
    if (!visible) this.label.setVisible(false);
  }
  setIdentity(identity: Identity) {
    this.identity = identity;
    this.actor.setTexture(actorTexture(this.actor.scene, identity));
    this.label.setText(identity);
  }
  place(point: Point) {
    this.anchor.body?.reset(point.x, point.y);
    this.previousX = point.x;
    this.previousY = point.y;
  }
  update(time: number, delta: number, x: number, y: number, enabled: boolean, speed = 71): boolean {
    const body = this.anchor.body;
    if (!body) return false;
    const magnitude = Math.hypot(x, y) || 1;
    const blend = Math.min(1, delta / 72);
    if (enabled) {
      this.anchor.setVelocity(Phaser.Math.Linear(body.velocity.x, x / magnitude * speed, blend),
        Phaser.Math.Linear(body.velocity.y, y / magnitude * speed, blend));
    } else this.stop();
    if (x) this.actor.setFlipX(x < 0);
    const moved = Math.hypot(this.x - this.previousX, this.y - this.previousY);
    this.previousX = this.x;
    this.previousY = this.y;
    this.distance += moved;
    const active = moved > .15;
    const phase = active ? this.distance * .46 : time / 420;
    const bob = active ? Math.round(Math.abs(Math.sin(phase)) * 1.4) : 0;
    const scale = 1 + Math.sin(phase) * (active ? .035 : .016);
    this.actor.setPosition(Math.round(this.x) + (active ? Math.sign(x) : 0), Math.round(this.y) - bob - (active && y < 0 ? 1 : 0)).setScale(2 - scale, scale).setDepth(this.y + 2);
    this.label.setPosition(Math.round(this.x), Math.round(this.y) - 15);
    this.shadow.setPosition(Math.round(this.x), Math.round(this.y) + 1).setDepth(this.y + 1);
    if (active && this.distance - this.lastStep >= 13) {
      this.lastStep = this.distance;
      return true;
    }
    return false;
  }
}
