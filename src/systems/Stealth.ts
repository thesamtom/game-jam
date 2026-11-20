import Phaser from 'phaser';
import type { Box, Point } from '../data/maps/layout';
import type { Npc } from '../entities/Npc';

interface Patrol {
  actor: Npc; waypoints: readonly Point[];
  speed: number; facing: number; angle: number; range: number; loop: boolean;
  wait?: number;
  maxLead?: number;
}
interface Watcher extends Patrol { next: number; idle: number; finished: boolean }
const FULL_ALERT_MS = 1500;

function intersection(origin: Point, dx: number, dy: number, bounds: Box, distance: number): number {
  let from = 0;
  let to = distance;
  for (let axis = 0; axis < 2; axis++) {
    const value = axis ? origin.y : origin.x;
    const direction = axis ? dy : dx;
    const min = axis ? bounds.y : bounds.x;
    const max = min + (axis ? bounds.h : bounds.w);
    if (Math.abs(direction) < .000001) {
      if (value < min || value > max) return distance;
      continue;
    }
    const first = (min - value) / direction;
    const second = (max - value) / direction;
    from = Math.max(from, Math.min(first, second));
    to = Math.min(to, Math.max(first, second));
    if (from > to) return distance;
  }
  return from;
}

export class Stealth {
  readonly watchers: Watcher[];
  private readonly cone: Phaser.GameObjects.Graphics;
  private readonly obstacles: Box[];
  suspicion = 0;
  seen = false;
  tries = 0;
  private immunity = 600;
  constructor(scene: Phaser.Scene, patrols: readonly Patrol[], solidTiles: readonly Box[]) {
    this.cone = scene.add.graphics().setDepth(-5);
    this.obstacles = solidTiles.map(s => ({ x: s.x * 16, y: s.y * 16, w: s.w * 16, h: s.h * 16 }));
    this.watchers = patrols.map(p => ({ ...p, next: 1, idle: 0, finished: false }));
  }
  get complete() { return this.watchers.every(patrol => patrol.finished); }
  private range(origin: Point, dx: number, dy: number, distance: number) {
    let result = distance;
    for (const box of this.obstacles) result = Math.min(result, intersection(origin, dx, dy, box, result));
    return result;
  }
  private visible(watcher: Watcher, point: Point) {
    const { x, y } = watcher.actor.point;
    const dx = point.x - x, dy = point.y - y;
    const distance = Math.hypot(dx, dy);
    if (distance > watcher.range) return false;
    if (distance < 1) return true;
    const offset = Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - watcher.facing);
    return Math.abs(offset) <= watcher.angle && this.range(watcher.actor.point, dx / distance, dy / distance, distance) >= distance - .01;
  }
  private move(watcher: Watcher, delta: number) {
    if (watcher.finished) return;
    if (watcher.idle > 0) { watcher.idle -= delta; return; }
    const target = watcher.waypoints[watcher.next];
    if (!target) { watcher.finished = true; return; }
    const point = watcher.actor.point;
    const dx = target.x - point.x;
    const dy = target.y - point.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 0.01) watcher.facing = Math.atan2(dy, dx);
    if (dx) watcher.actor.image.setFlipX(dx < 0);
    const step = watcher.speed * delta / 1000;
    if (distance > step) {
      point.x += dx / distance * step;
      point.y += dy / distance * step;
      return;
    }
    Object.assign(point, target);
    watcher.idle = watcher.wait ?? 300;
    watcher.next++;
    if (watcher.loop && watcher.next >= watcher.waypoints.length) watcher.next = 0;
  }
  update(delta: number, point: Point, active: boolean) {
    this.cone.clear();
    if (!active || this.seen) return;
    this.immunity = Math.max(0, this.immunity - delta);
    for (const watcher of this.watchers) {
      const from = watcher.actor.point;
      if (!watcher.maxLead || Math.hypot(from.x - point.x, from.y - point.y) <= watcher.maxLead) this.move(watcher, delta);
    }
    const visible = !this.immunity && this.watchers.some(watcher => this.visible(watcher, point));
    this.suspicion = Phaser.Math.Clamp(this.suspicion + delta / FULL_ALERT_MS * (visible ? 1 : -.83), 0, 1);
    this.seen = this.suspicion >= 1;
    for (const watcher of this.watchers) this.draw(watcher);
  }
  private draw(watcher: Watcher) {
    const { x, y } = watcher.actor.point;
    const color = this.suspicion > .65 ? 0xff7561 : 0xf3cd71;
    const steps = 36;
    const start = watcher.facing - watcher.angle;
    this.cone.fillStyle(color, .17 + this.suspicion * .25);
    this.cone.lineStyle(.5, color, .64).beginPath().moveTo(x, y);
    for (let i = 0; i <= steps; i++) {
      const angle = start + i * watcher.angle * 2 / steps;
      const dx = Math.cos(angle), dy = Math.sin(angle);
      const distance = this.range(watcher.actor.point, dx, dy, watcher.range);
      this.cone.lineTo(x + dx * distance, y + dy * distance);
    }
    this.cone.closePath().fillPath().strokePath();
  }
  reset() {
    this.suspicion = 0;
    this.seen = false;
    this.immunity = 700;
    this.tries++;
    for (const watcher of this.watchers) {
      Object.assign(watcher.actor.point, watcher.waypoints[0]);
      watcher.next = 1;
      watcher.idle = 0;
      watcher.finished = false;
    }
  }
  destroy() { this.cone.destroy(); }
}
