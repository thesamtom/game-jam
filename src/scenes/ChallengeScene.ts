import Phaser from 'phaser';
import { challenges } from '../data/challenges';
import { town } from '../data/maps/town';
import { Npc } from '../entities/Npc';
import { Player, type Identity } from '../entities/Player';
import { Input, type Direction } from '../systems/Input';
import { Stealth } from '../systems/Stealth';
import { ChallengeManager } from '../systems/ChallengeManager';
import type { ChallengeResult } from '../systems/FieldRecord';
import { closest } from '../systems/ExplorationManager';
import { audio } from '../systems/Audio';
import { button, UI } from './UIScene';
import { element } from './CaseFile';
import { renderWorld } from './WorldView';

export interface ChallengeLaunch {
  id: string; identity: Identity; difficulty: number;
  complete?: (result: ChallengeResult) => void;
  spotted?: () => void;
  done: () => void;
}

type Mission = typeof challenges[number];
declare global {
  interface Window { challengeTest?: { place: (id: string) => void; expose: () => void } }
}

export class ChallengeScene extends Phaser.Scene {
  private mission!: Mission;
  private settings!: ChallengeLaunch;
  private measure!: ChallengeManager;
  private player!: Player;
  private inputActions!: Input;
  private ui!: UI;
  private panel!: HTMLElement;
  private markers!: Phaser.GameObjects.Graphics;
  private watcher?: Npc;
  private stealth?: Stealth;
  private inspected = new Set<string>();
  private activeRun = false;
  private answering = false;
  private result?: ChallengeResult;
  private leaving = false;
  private forceExpose = false;
  constructor() { super('Challenge'); }
  create(settings: ChallengeLaunch) {
    const mission = challenges.find(item => item.id === settings.id);
    if (!mission) { settings.done(); this.scene.stop(); return; }
    this.mission = mission;
    this.settings = settings;
    this.measure = new ChallengeManager();
    this.inspected.clear();
    this.activeRun = false;
    this.result = undefined;
    this.leaving = false;
    this.forceExpose = false;
    this.answering = false;
    this.watcher = undefined;
    this.stealth = undefined;
    const collision = renderWorld(this, town);
    this.player = new Player(this, mission.start, settings.identity);
    this.physics.add.collider(this.player.anchor, collision);
    this.cameras.main.startFollow(this.player.anchor, true, .18, .18).centerOn(this.player.x, this.player.y);
    this.markers = this.add.graphics().setDepth(5005);
    this.ui = new UI(() => this.interact());
    this.game.events.emit('hud:mount', this.ui.root);
    this.ui.vignette.classList.add('night');
    const back = button('Leave challenge', () => this.leave(), 'icon-button');
    this.ui.utility.append(back);
    this.inputActions = new Input(action => {
      if (action === 'pause') this.leave();
      if (action === 'interact') this.interact();
      if (action === 'mute') audio.toggle();
    }, () => audio.unlock());
    this.addTouchControls();
    this.panel = document.createElement('section');
    this.panel.className = 'field-panel';
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-label', 'Optional challenge');
    this.ui.root.append(this.panel);
    this.ui.setObjective('Optional challenge / ' + this.mission.category, this.mission.title, this.mission.description);
    this.overlay(this.mission.title, this.mission.description, 'Begin challenge', () => this.begin());
    this.events.once('shutdown', () => {
      this.inputActions.destroy();
      this.ui.destroy();
      if (import.meta.env.DEV) delete window.challengeTest;
    });
    if (import.meta.env.DEV) window.challengeTest = {
      place: id => {
        const at = id === 'finish' ? mission.finish : mission.observations?.find(item => item.id === id)?.at;
        if (at) this.player.place(at);
      },
      expose: () => { this.forceExpose = true; }
    };
  }

  private addTouchControls() {
    const pad = document.createElement('div');
    pad.className = 'd-pad';
    const directions: [Direction, string][] = [['up','▲'], ['left','◀'], ['down','▼'], ['right','▶']];
    for (const [direction, glyph] of directions) {
      const key = button(glyph, () => {}, 'd-' + direction);
      key.setAttribute('aria-label', 'Move ' + direction);
      this.inputActions.bind(key, direction);
      pad.append(key);
    }
    const key = button('E', () => this.interact(), 'touch-interact');
    key.setAttribute('aria-label', 'Interact nearby');
    this.ui.touch.append(pad, key);
  }

  private begin() {
    this.inspected.clear();
    this.measure.clues = 0;
    this.forceExpose = false;
    this.player.place(this.mission.start);
    this.stealth?.destroy();
    this.watcher?.destroy();
    const route = this.mission.patrol;
    if (route) {
      const shadow = this.mission.category === 'Shadow';
      this.watcher = new Npc(this, shadow ? 'Kuttappan' : 'Sudhi', { ...route[0] });
      this.stealth = new Stealth(this, [{
        actor: this.watcher, waypoints: route, speed: shadow ? 31 : 23, facing: shadow ? 1 : Math.PI,
        angle: .61, range: 60 + this.settings.difficulty, loop: !shadow, wait: 220, maxLead: shadow ? 97 : undefined
      }], town.solids);
    }
    if (this.mission.question) this.deduction();
    else {
      this.panel.hidden = true;
      this.ui.root.classList.remove('field-open');
      this.activeRun = true;
    }
  }

  private deduction() {
    const question = this.mission.question!;
    this.overlay(this.mission.title, question.context, 'Leave challenge', () => this.leave());
    this.answering = true;
    const feedback = element('p', '');
    feedback.setAttribute('aria-live', 'polite');
    let wrong = 0;
    const answers = question.answers.map((answer, index) => button(answer, () => {
      if (index === question.correct) {
        this.measure.clues = 3;
        this.succeed();
        return;
      }
      this.measure.mistakes++;
      wrong++;
      if (wrong === 2) this.fail('The two copies do not support those conclusions.');
      else feedback.textContent = this.mission.tip;
    }, 'menu-button'));
    this.panel.querySelector('button')?.before(...answers, feedback);
  }

  private overlay(title: string, text: string, action: string, run: () => void) {
    this.activeRun = false;
    this.answering = false;
    this.player.stop();
    this.inputActions.clear();
    this.ui.prompt.hidden = true;
    this.ui.root.classList.add('field-open');
    this.panel.hidden = false;
    this.panel.replaceChildren(element('span', this.mission.category + ' / Optional', 'eyebrow'),
      element('h2', title), element('p', text), button(action, run, 'menu-button primary'));
  }

  private currentNote() {
    return closest(this.mission.observations?.filter(item => !this.inspected.has(item.id)) ?? [], this.player, 18);
  }
  private interact() {
    if (!this.activeRun) return;
    const clue = this.currentNote();
    if (!clue) return;
    this.inspected.add(clue.id);
    if (!clue.clue) {
      this.measure.mistakes++;
      this.fail('That detail does not support the observation.');
      return;
    }
    this.measure.clues++;
    this.ui.setDistrict('CLUE LOGGED');
    this.ui.setObjective('Optional challenge / ' + this.mission.category, this.mission.title, clue.label);
    if (this.mission.category === 'Observation' && this.mission.observations?.every(item => !item.clue || this.inspected.has(item.id))) this.succeed();
  }

  private fail(text: string) {
    this.overlay('Try again', text + ' ' + this.mission.tip, 'Retry challenge', () => {
      this.measure.retries++;
      this.begin();
    });
    this.panel.append(button('Return', () => this.leave(), 'menu-button'));
  }
  private succeed() {
    this.result = this.measure.complete();
    ChallengeManager.post(this.mission.id, this.result);
    const result = this.result;
    this.settings.complete?.(result);
    this.overlay('Rank ' + result.grade, result.score + ' points · ' + result.clues + ' clues · '
      + result.detections + ' detections · ' + result.retries + ' retries · ' + result.seconds + ' s', 'Return', () => this.leave());
  }
  private leave() {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.stop();
    this.settings.done();
  }

  update(time: number, delta: number) {
    if (this.activeRun || this.answering) this.measure.elapsed += delta;
    if (!this.activeRun) return;
    this.player.update(time, delta, this.inputActions.x, this.inputActions.y, true);
    this.markers.clear();
    if (this.stealth) {
      if (import.meta.env.DEV && this.forceExpose) {
        const watcher = this.stealth.watchers[0];
        this.player.place({ x: watcher.actor.point.x + Math.cos(watcher.facing) * 7, y: watcher.actor.point.y + Math.sin(watcher.facing) * 7 });
      }
      this.stealth.update(delta, this.player, true);
      this.watcher?.update(time);
      this.ui.setSuspicion(this.stealth.suspicion);
      if (this.stealth.seen) {
        this.measure.detections++;
        this.settings.spotted?.();
        this.fail('You were spotted.');
        return;
      }
    }
    const finish = this.mission.finish;
    if (finish && (this.mission.category !== 'Shadow' || this.stealth?.complete)) {
      this.markers.lineStyle(1, 0xf5c588).strokeCircle(finish.x, finish.y, 7);
      if (Math.hypot(finish.x - this.player.x, finish.y - this.player.y) < 18) { this.succeed(); return; }
    }
    for (const item of this.mission.observations ?? []) {
      if (this.inspected.has(item.id)) continue;
      this.markers.lineStyle(1, 0x9dd7c6).strokeRect(item.at.x - 3, item.at.y - 7, 6, 6);
    }
    this.ui.prompt.hidden = !this.currentNote();
    this.ui.prompt.textContent = 'E · Inspect detail';
    this.ui.touch.classList.toggle('near', !this.ui.prompt.hidden);
  }
}
