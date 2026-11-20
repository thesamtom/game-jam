import Phaser from 'phaser';
import type { Point } from '../data/maps/layout';
import type { Npc } from '../entities/Npc';

export type Cue = 'step' | 'interact' | 'dialogue' | 'quest' | 'alert' | 'gunshot' | 'fall' | 'impact';
export class CutsceneRunner {
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly quick = import.meta.env.DEV && new URLSearchParams(location.search).has('fast');
  private readonly controller = new AbortController();
  private readonly camera: Phaser.Cameras.Scene2D.Camera;
  private readonly scene: Phaser.Scene;
  private readonly panel: HTMLElement;
  private readonly freezeInput: (locked: boolean) => void;
  private readonly cue: (sound: Cue) => void;
  private readonly resumeFollow: () => void;
  private running = false;

  constructor(scene: Phaser.Scene, panel: HTMLElement, freezeInput: (locked: boolean) => void,
    resumeFollow: () => void, cue = (_sound: Cue) => {}) {
    this.scene = scene;
    this.panel = panel;
    this.camera = scene.cameras.main;
    this.freezeInput = freezeInput;
    this.resumeFollow = resumeFollow;
    this.cue = cue;
    scene.events.once('shutdown', () => this.destroy());
  }
  get active() { return this.running; }
  private duration(ms: number) { return this.quick ? Math.min(ms, 65) : ms; }
  async run(sequence: () => Promise<void>) {
    if (this.running || this.controller.signal.aborted) return;
    this.running = true;
    this.freezeInput(true);
    try {
      await sequence();
    } finally {
      if (!this.controller.signal.aborted) {
        this.hideCaption();
        this.panel.classList.remove('black');
        this.camera.resetFX();
        this.resumeFollow();
        this.freezeInput(false);
      }
      this.running = false;
    }
  }
  wait(ms: number): Promise<void> {
    const signal = this.controller.signal;
    if (signal.aborted) return Promise.resolve();
    return new Promise(resolve => {
      const timer = this.scene.time.delayedCall(this.duration(ms), () => {
        signal.removeEventListener('abort', cancel);
        resolve();
      });
      const cancel = () => { timer.remove(false); resolve(); };
      signal.addEventListener('abort', cancel, { once: true });
    });
  }
  async caption(text: string, ms = 2800, black = false, title?: string) {
    this.panel.replaceChildren();
    this.panel.classList.toggle('black', black);
    if (title) {
      const tag = document.createElement('span');
      tag.className = 'eyebrow';
      tag.textContent = title;
      this.panel.append(tag);
    }
    const words = document.createElement('p');
    words.textContent = text;
    this.panel.append(words);
    this.panel.hidden = false;
    await this.wait(ms);
    this.hideCaption();
  }
  black(on: boolean) {
    this.panel.replaceChildren();
    this.panel.classList.toggle('black', on);
    this.panel.hidden = !on;
  }
  stage(on: boolean) {
    this.panel.replaceChildren();
    this.panel.classList.toggle('stage', on);
    this.panel.hidden = !on;
  }
  private hideCaption() { this.panel.hidden = true; this.panel.classList.remove('stage'); }
  async fade(out: boolean, ms = 360) {
    if (this.controller.signal.aborted) return;
    const duration = this.duration(ms);
    if (out) this.camera.fadeOut(duration, 9, 13, 19, undefined, undefined);
    else this.camera.fadeIn(duration, 9, 13, 19, undefined, undefined);
    await this.wait(ms);
  }
  flash(ms = 145, r = 255, g = 245, b = 231) {
    if (!this.controller.signal.aborted) this.camera.flash(this.duration(ms), r, g, b, true);
    if (this.reducedMotion) this.camera.flashEffect.alpha = .2;
  }
  shake(ms = 260, intensity = .009) {
    if (!this.reducedMotion && !this.controller.signal.aborted) this.camera.shake(this.duration(ms), intensity, true);
  }
  async pan(target: Point, ms = 550) {
    if (this.controller.signal.aborted) return;
    this.camera.stopFollow();
    this.camera.pan(target.x, target.y, this.duration(ms), 'Sine.easeInOut', true);
    await this.wait(ms);
  }
  async move(actor: Npc, destination: Point, ms = 500) {
    if (this.controller.signal.aborted) return;
    actor.image.setFlipX(actor.point.x > destination.x);
    this.scene.tweens.add({ targets: actor.point, ...destination, duration: this.duration(ms), ease: 'Sine.easeInOut' });
    await this.wait(ms);
    if (!this.controller.signal.aborted) Object.assign(actor.point, destination);
  }
  async waypoints(actor: Npc, points: readonly Point[], ms = 450) {
    for (const destination of points) await this.move(actor, destination, ms);
  }
  sound(cue: Cue) { if (!this.controller.signal.aborted) this.cue(cue); }
  changeScene(key: string, data?: object) { if (!this.controller.signal.aborted) this.scene.scene.start(key, data); }
  destroy() { this.controller.abort(); }
}
