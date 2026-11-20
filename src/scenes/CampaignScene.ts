import Phaser from 'phaser';
import type { Layout, Point } from '../data/maps/layout';
import { Npc, type Appearance, actorTexture } from '../entities/Npc';
import { CutsceneRunner } from '../systems/CutsceneRunner';
import { enact } from '../data/cutscenes';
import { Stealth } from '../systems/Stealth';
import { cell } from '../data/maps/layout';
import { saveCampaign, safePosition } from '../systems/Save';
import { maps } from '../data/maps';
import { Player } from '../entities/Player';
import { Input, type Direction, type InputAction } from '../systems/Input';
import { UI, button } from './UIScene';
import { audio } from '../systems/Audio';
import { DialogueManager } from '../systems/DialogueManager';
import { dialogue, type DialogueId } from '../data/dialogue';
import { QuestManager, type Campaign } from '../systems/QuestManager';
import type { Objective, Place } from '../data/chapters';
import { challenges } from '../data/challenges';
import { unlocked } from '../data/discoveries';
import { ChallengeManager } from '../systems/ChallengeManager';
import type { ChallengeLaunch } from './ChallengeScene';
import { FieldView } from './FieldView';
import { currentRank } from '../systems/ProgressionManager';
import { activities } from '../data/activities';
import { discoveries } from '../data/discoveries';
import { TownStateManager } from '../systems/TownStateManager';
import { dressWorld, renderWorld } from './WorldView';

export interface RoamLaunch { campaign: Campaign; roam: true; back?: () => void }

interface TestDriver {
  place: (mark: string) => void;
  advance: () => boolean | 'choice';
  expose: (enabled: boolean) => void;
  fieldPlace: (id: string) => void;
}
declare global {
  interface Window { render_game_to_text?: () => string; randuTest?: TestDriver }
}

export class CampaignScene extends Phaser.Scene {
  protected player!: Player;
  protected controls!: Input;
  protected hud!: UI;
  protected conversation!: DialogueManager;
  protected quest!: QuestManager;
  protected npcs: Npc[] = [];
  protected busy = false;
  protected fx!: CutsceneRunner;
  private district = '';
  private readonly announcedDistricts = new Set<string>();
  private currentTarget?: Point;
  private marker!: Phaser.GameObjects.Graphics;
  private notice = '';
  private paused = false;
  private sideSceneActive = false;
  private roaming = false;
  private backFromVisit?: () => void;
  private townState!: TownStateManager;
  private ambient?: Stealth;
  private ambientName?: Npc;
  private debugSnapshot?: () => string;
  private debugDriver?: TestDriver;
  private field!: FieldView;
  private muteButton!: HTMLButtonElement;
  private stealth?: Stealth;
  private stealthCheckpoint?: Point;
  private exposeForTest = false;
  constructor(readonly place: Place, protected readonly layout: Layout, key: string = place) { super(key); }

  create(input: Campaign | RoamLaunch) {
    const visit = 'roam' in input ? input : undefined;
    const state = 'roam' in input ? input.campaign : input;
    this.roaming = Boolean(visit);
    this.backFromVisit = visit?.back;
    this.townState = new TownStateManager(state);
    this.quest = new QuestManager(state);
    this.busy = false;
    this.paused = false;
    this.sideSceneActive = false;
    this.ambient = undefined;
    this.ambientName = undefined;
    this.district = '';
    this.announcedDistricts.clear();
    this.npcs = [];
    this.stealth = undefined;
    this.exposeForTest = false;
    const solids = renderWorld(this, this.layout);
    const map = maps[this.place];
    const chapterPoint = map.marks[this.quest.chapter.checkpoint];
    const roamStart = this.roaming ? map.marks[this.place === 'Town' ? 'homeStart' : 'entry'] : undefined;
    const start = roamStart ?? state.position ?? (this.quest.step.spawn ? this.mark(this.quest.step.spawn) : chapterPoint)
      ?? (this.step.at ? this.mark(this.step.at) : Object.values(map.marks)[0]);
    this.player = new Player(this, start, state.identity);
    this.physics.add.collider(this.player.anchor, solids);
    this.cameras.main.startFollow(this.player.anchor, true, .15, .15);
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.hud = new UI(() => this.controls.press('interact'));
    this.game.events.emit('hud:mount', this.hud.root);
    this.conversation = new DialogueManager(this.hud.dialogue);
    this.controls = new Input(action => this.action(action), () => audio.unlock());
    this.field = new FieldView(this, this.place, state, this.hud.root, () => saveCampaign(state), () => {
      this.player.stop(); this.controls.clear();
    }, id => this.launchChallenge(id));
    this.bindInterface();
    this.fx = new CutsceneRunner(this, this.hud.caption, locked => {
      if (locked) { this.player.stop(); this.controls.clear(); }
    }, () => this.cameras.main.startFollow(this.player.anchor, true, .15, .15), cue => audio.play(cue));
    this.marker = this.add.graphics().setDepth(5005);
    if (import.meta.env.DEV) this.installTestDriver();
    this.events.once('shutdown', () => {
      this.controls.destroy();
      this.conversation.close();
      this.hud.destroy();
      if (import.meta.env.DEV) {
        if (window.randuTest === this.debugDriver) delete window.randuTest;
        if (window.render_game_to_text === this.debugSnapshot) delete window.render_game_to_text;
      }
    });
    if (this.roaming) {
      this.currentTarget = undefined;
      this.refreshTown();
      this.hud.setObjective('Optional exploration', this.backFromVisit ? 'Explore the ' + (this.place === 'Park' ? 'park' : 'rooftop') : 'Explore Karimkunnu',
        this.backFromVisit ? 'Return to the entrance when you’re ready.' : 'Review unfinished leads in the Case File.');
    } else this.beginObjective(true);
    this.cameras.main.fadeIn(275, 13, 19, 25);
  }

  protected mark(id: string): Point {
    const mark = this.layout.marks[id];
    if (!mark) throw new Error(`Missing ${this.place} waypoint: ${id}`);
    return mark;
  }
  protected get step() { return this.quest.step; }
  protected get position(): Point { return { x: this.player.x, y: this.player.y }; }
  protected addNpc(name: Appearance, position: Point): Npc {
    const actor = new Npc(this, name, position);
    this.npcs.push(actor);
    return actor;
  }
  protected beginObjective(initial = false) {
    for (const actor of this.npcs) actor.destroy();
    this.npcs = [];
    const step = this.step;
    this.stealth?.destroy();
    this.stealth = undefined;
    this.hud.setSuspicion();
    if (!initial && step.spawn) this.player.place(this.mark(step.spawn));
    this.currentTarget = step.at ? this.mark(step.at) : undefined;
    if (step.actor && this.currentTarget) this.addNpc(step.actor, this.currentTarget);
    if (step.id === 'briefing') this.addNpc('Hamsa', { x: this.mark('raghavan').x + 24, y: this.mark('raghavan').y + 3 });
    if (step.id === 'tail' || step.id === 'survive') this.startStealth(step.id);
    this.refreshTown();
    this.field.achievements();
    this.notice = '';
    this.presentObjective();
    this.quest.state.position = safePosition(this.place, this.position) ? this.position : undefined;
    saveCampaign(this.quest.state);
    if (step.mode === 'auto') this.time.delayedCall(80, () => void this.activate(step));
  }
  private refreshTown() {
    this.townState.sync();
    const settings = this.townState.settings;
    this.hud.vignette.classList.add('field-tone');
    this.hud.vignette.style.setProperty('--town-grade', settings.grading);
    dressWorld(this, settings.lamp, settings.yard);
    this.ambient?.destroy();
    this.ambient = undefined;
    this.ambientName = undefined;
    if (!this.stealth && this.place === 'Town' && settings.watch && this.step.mode !== 'auto'
      && !this.npcs.some(actor => actor.name === settings.watch)) {
      const actor = this.addNpc(settings.watch, { ...settings.route[0] });
      actor.label.setVisible(true);
      this.ambientName = actor;
      this.ambient = new Stealth(this, [{
        actor, waypoints: settings.route, speed: 17, facing: Math.PI / 2,
        angle: .50, range: 40, loop: true, wait: 400
      }], this.layout.solids);
    }
    this.field.refresh();
    this.setAmbience();
  }

  private startStealth(id: string) {
    this.stealthCheckpoint = this.position;
    if (id === 'tail') {
      const waypoints = [cell(32, 14.5), cell(33.2, 16), cell(33.2, 18.1), cell(32, 20), cell(32, 21.3)];
      const actor = this.addNpc('Kuttappan', { ...waypoints[0] });
      actor.label.setVisible(true);
      this.stealth = new Stealth(this, [{ actor, waypoints, speed: 32, facing: 1, angle: .62, range: 69, loop: false, wait: 240, maxLead: 97 }], this.layout.solids);
    } else {
      const south = [cell(41.5, 33.7), cell(37.2, 34.5), cell(33, 34.6)];
      const north = [cell(37.5, 25.7), cell(41.7, 27.1), cell(41.8, 30.2)];
      this.stealth = new Stealth(this, [
        { actor: this.addNpc('Sudhi', { ...south[0] }), waypoints: south, speed: 24, facing: Math.PI, angle: .58, range: 67, loop: true },
        { actor: this.addNpc('Vishnu', { ...north[0] }), waypoints: north, speed: 24, facing: 0, angle: .58, range: 62, loop: true }
      ], this.layout.solids);
    }
    this.hud.setSuspicion(0);
  }
  private async retryStealth() {
    this.busy = true;
    this.player.stop();
    this.controls.clear();
    this.fx.flash(260, 220, 48, 52);
    this.fx.sound('alert');
    this.field.progression.spotted(this.step.id);
    saveCampaign(this.quest.state);
    await this.fx.wait(330);
    await this.fx.fade(true, 260);
    if (!this.sys.isActive() || !this.stealth || !this.stealthCheckpoint) return;
    this.player.place(this.stealthCheckpoint);
    this.stealth.reset();
    this.exposeForTest = false;
    this.hud.setDistrict('SPOTTED  /  CHECKPOINT RESTORED');
    await this.fx.fade(false, 320);
    this.busy = false;
  }
  private presentObjective(direction = '') {
    const chapter = this.quest.chapter;
    const step = this.step;
    const hint = [direction, step.hint].filter(Boolean).join(' · ');
    this.hud.setObjective(`Chapter ${chapter.id} / ${chapter.title}`, step.goal, hint);
  }
  private bindInterface() {
    const pause = button('Ⅱ', () => this.controls.press('pause'), 'icon-button');
    pause.setAttribute('aria-label', 'Pause');
    this.muteButton = button('', () => this.controls.press('mute'), 'icon-button');
    this.updateMuteButton();
    const file = button('Case File', () => this.controls.press('case'), 'icon-button');
    this.hud.utility.append(file, this.muteButton, pause);
    const pad = document.createElement('div');
    pad.className = 'd-pad';
    const labels: [Direction, string][] = [['up', '▲'], ['left', '◀'], ['down', '▼'], ['right', '▶']];
    for (const [direction, glyph] of labels) {
      const key = button(glyph, () => {}, 'd-' + direction);
      key.setAttribute('aria-label', 'Move ' + direction);
      this.controls.bind(key, direction);
      pad.append(key);
    }
    const interact = button('E', () => this.controls.press('interact'), 'touch-interact');
    interact.setAttribute('aria-label', 'Interact nearby');
    this.hud.touch.append(pad, interact);
  }

  private updateMuteButton() {
    this.muteButton.textContent = audio.muted ? 'Sound off' : 'Sound on';
    this.muteButton.setAttribute('aria-label', audio.muted ? 'Unmute' : 'Mute');
  }

  private setAmbience() {
    const level = !this.roaming && (this.step.id === 'funeral' || this.step.id === 'home') ? 0
      : this.quest.state.chapter === 9 ? .12
      : this.stealth || this.place === 'Roof' ? .72
      : this.townState.settings.ambience;
    audio.ambience(this.paused || this.step.id === 'opening' ? 0 : level);
  }

  private pause() {
    if (this.busy || this.conversation.active) return;
    this.paused = !this.paused;
    this.controls.clear();
    this.player.stop();
    this.hud.pausePanel.hidden = !this.paused;
    this.hud.root.classList.toggle('paused', this.paused);
    this.setAmbience();
    if (!this.paused) return;
    const box = document.createElement('section');
    const heading = document.createElement('h2');
    heading.textContent = 'Paused';
    const detail = document.createElement('p');
    detail.textContent = 'Continue returns you to the last story checkpoint.';
    const resume = button('Resume', () => this.pause(), 'menu-button primary');
    box.append(heading, detail, resume, this.backFromVisit
      ? button('Return to town', () => this.exitVisit(), 'menu-button')
      : button('Return to title', () => this.scene.start('Title'), 'menu-button'));
    this.hud.pausePanel.replaceChildren(box);
    resume.focus();
  }

  protected action(action: InputAction) {
    if (this.sideSceneActive) return;
    if (action === 'mute') { audio.toggle(); this.updateMuteButton(); return; }
    if (this.field.active) {
      if (action === 'pause' || action === 'case') this.field.close();
      return;
    }
    if (action === 'pause') { this.pause(); return; }
    if (this.paused) return;
    if (action === 'case' && !this.busy && !this.conversation.active) { this.field.openFile(); return; }
    if (this.conversation.active) {
      if (action === 'interact' || action === 'advance') this.conversation.advance();
      return;
    }
    if (this.busy || action !== 'interact') return;
    if (!this.roaming && this.step.mode === 'interact' && this.nearTarget()) { audio.play('interact'); void this.activate(this.step); }
    else if (!this.stealth && this.field.prompt) this.field.interact();
    else if (!this.stealth) this.useLocalInteraction();
  }

  private nearbyPortal() {
    if (this.stealth) return undefined;
    const near = (mark: string) => Math.hypot(this.player.x - this.mark(mark).x, this.player.y - this.mark(mark).y) < 20;
    if (this.backFromVisit && near('entry')) return 'Back to Karimkunnu';
    if (this.place !== 'Town') return undefined;
    if (near('parkPath')) return 'Visit Town Park';
    if (this.quest.state.flags.includes('meet') && near('roofVisit')) return 'Revisit the rooftop';
    return undefined;
  }

  private useLocalInteraction() {
    const portal = this.nearbyPortal();
    if (portal === 'Back to Karimkunnu') { this.exitVisit(); return; }
    if (portal) {
      const launch: RoamLaunch = { campaign: this.quest.state, roam: true, back: () => this.resumeSideScene() };
      this.suspendSideScene(portal === 'Visit Town Park' ? 'FieldPark' : 'FieldRoof', launch);
      return;
    }
    if (this.nearWatch()) this.field.show(this.ambientName!.name, this.townState.greeting(), 'Optional conversation');
  }

  private nearWatch() {
    const actor = this.ambientName;
    return actor && Math.hypot(actor.point.x - this.player.x, actor.point.y - this.player.y) < 15;
  }

  private suspendSideScene(key: string, data: RoamLaunch | ChallengeLaunch) {
    this.sideSceneActive = true;
    this.field.close();
    this.player.stop();
    this.controls.clear();
    this.hud.root.hidden = true;
    this.scene.launch(key, data);
    this.scene.pause();
  }

  private resumeSideScene() {
    this.controls.clear();
    this.updateMuteButton();
    this.sideSceneActive = false;
    this.hud.root.hidden = false;
    this.field.refresh();
    this.setAmbience();
    if (import.meta.env.DEV) this.installTestDriver();
    this.scene.resume();
  }

  private exitVisit() {
    this.scene.stop();
    this.backFromVisit?.();
  }

  private launchChallenge(id: string) {
    const mission = challenges.find(entry => entry.id === id);
    const campaign = this.quest.state;
    const first = !Object.hasOwn(campaign.field.records, id);
    if (!mission || first && !unlocked(mission.unlock, campaign) || this.busy || this.sideSceneActive || this.conversation.active) return;
    let alerted = false;
    const settings: ChallengeLaunch = {
      id, identity: campaign.identity, difficulty: campaign.chapter >= 6 ? 5 : 0,
      spotted: first ? () => {
        if (alerted) return;
        alerted = true;
        this.field.progression.reputation(0, 4, 'Seen during a challenge');
        saveCampaign(campaign);
      } : undefined,
      complete: first ? result => {
        ChallengeManager.best(campaign.field.records, id, result);
        this.field.progression.award(mission.xp, mission.title);
        campaign.field.investigation++;
        this.field.achievements();
        saveCampaign(campaign);
      } : undefined,
      done: () => this.resumeSideScene()
    };
    this.suspendSideScene('Challenge', settings);
  }

  protected async activate(step: Objective) {
    if (this.busy || step !== this.step) return;
    this.busy = true;
    this.player.stop();
    this.hud.prompt.hidden = true;
    if (step.id === 'meet') this.stageRoofGang();
    if (step.dialogue) await this.speak(step.dialogue);
    if (step.cutscene) await this.runCutscene(step.cutscene);
    if (!this.sys.isActive()) return;
    const result = this.quest.complete(step.id);
    this.busy = false;
    if (result !== 'ignored') {
      this.field.progression.story(step.id);
      this.field.achievements();
    }
    if (result === 'credits') {
      saveCampaign(this.quest.state, true);
      this.fx.changeScene('Credits', { ending: true });
      return;
    }
    if (result === 'ignored') return;
    audio.play('quest');
    const next = this.step;
    const state = this.quest.state;
    if (next.scene !== this.place) {
      state.position = undefined;
      saveCampaign(state);
      this.fx.changeScene(next.scene, state);
      return;
    }
    if (result === 'chapter') this.field.progression.reputation(0, -6, 'The town’s attention moved on');
    if (result === 'chapter') this.hud.setDistrict(`CHAPTER ${this.quest.chapter.id} — ${this.quest.chapter.title.toUpperCase()}`);
    this.beginObjective();
  }
  protected speak(id: DialogueId): Promise<void> {
    if (!this.sys.isActive()) return Promise.resolve();
    return new Promise(resolve => {
      const finish = () => { this.events.off('shutdown', finish); this.player.showName(false); resolve(); };
      this.events.once('shutdown', finish);
      this.conversation.open(dialogue[id], {
        end: finish, choose: choice => {
          this.quest.choice(choice);
          if (import.meta.env.DEV) document.documentElement.dataset.choice = choice;
        },
        style: id === 'message' ? 'phone' : undefined,
        tick: () => audio.play('dialogue'),
        portrait: actor => (this.textures.get(actorTexture(this, actor)).getSourceImage() as HTMLCanvasElement).toDataURL(),
        focus: name => {
          this.player.showName(name === this.player.identity);
          for (const actor of this.npcs) {
            const speaking = actor.name === name;
            actor.label.setVisible(speaking);
            if (speaking && actor.image.alpha === 0) actor.image.setAlpha(1);
          }
        }
      });
    });
  }
  private stageRoofGang() {
    const point = this.mark('meeting');
    this.addNpc('Shaji', { x: point.x + 29, y: point.y + 12 }).image.setAlpha(0);
    this.addNpc('Kuttappan', { x: point.x + 17, y: point.y - 4 }).image.setAlpha(0);
  }

  protected async runCutscene(id: string) {
    await enact(id, {
      fx: this.fx, focus: this.currentTarget ?? this.position,
      actor: (role, point) => this.addNpc(role, point), speak: name => this.speak(name),
      hide: roles => {
        this.npcs = this.npcs.filter(actor => {
          if (!roles.includes(actor.name)) return true;
          actor.destroy();
          return false;
        });
      },
      setPlayer: visible => this.player.setVisible(visible),
      switchIdentity: () => {
        this.quest.state.identity = 'Vishnu';
        this.player.setIdentity('Vishnu');
      }
    });
  }
  private nearTarget() {
    return this.currentTarget && Math.hypot(this.player.x - this.currentTarget.x, this.player.y - this.currentTarget.y) < 22;
  }
  update(time: number, delta: number) {
    const moving = !this.paused && !this.field.active && !this.busy && !this.conversation.active;
    this.conversation.update(delta);
    if (this.player.update(time, delta, this.controls.x, this.controls.y, moving, this.quest.state.chapter === 9 ? 54 : 71) && moving) audio.play('step');
    if (this.stealth) {
      const watcher = this.stealth.watchers[0];
      if (import.meta.env.DEV && this.exposeForTest && moving) {
        this.player.place({ x: watcher.actor.point.x + Math.cos(watcher.facing) * 9, y: watcher.actor.point.y + Math.sin(watcher.facing) * 9 });
      }
      this.stealth.update(delta, this.position, moving && !this.fx.active);
      this.hud.setSuspicion(this.stealth.suspicion, currentRank(this.quest.state.field.xp).warning);
      if (moving && this.stealth.seen) { void this.retryStealth(); return; }
    }
    this.updateAmbient(delta, moving);
    for (const actor of this.npcs) actor.update(time);
    const district = this.layout.districts.find(d => this.player.x >= d.x * 16 && this.player.x < (d.x + d.w) * 16
      && this.player.y >= d.y * 16 && this.player.y < (d.y + d.h) * 16)?.title ?? 'KARIMKUNNU';
    if (district !== this.district) {
      this.district = district;
      if (district !== 'KARIMKUNNU' && !this.announcedDistricts.has(district)) {
        this.announcedDistricts.add(district);
        this.hud.setDistrict(district);

      }
    }
    if (moving && this.townState.district(district)) {
      if (this.quest.state.field.visits > 1) this.field.progression.reputation(0, -3, 'Moved to another district');
      this.field.visit(district);
      this.field.refresh();
      saveCampaign(this.quest.state);
    }
    const near = Boolean(this.nearTarget());
    this.field.update(this.position, moving && !this.stealth);
    const prompt = !this.roaming && near && this.step.mode === 'interact' ? this.step.prompt ?? 'Interact'
      : this.field.prompt ?? this.nearbyPortal() ?? (this.nearWatch() ? 'Speak to ' + this.ambientName!.name : undefined);
    this.hud.prompt.hidden = !moving || !prompt;
    this.hud.touch.classList.toggle('near', moving && Boolean(prompt));
    if (!this.hud.prompt.hidden) this.hud.prompt.textContent = `E · ${prompt}`;
    const actor = this.npcs.find(npc => npc.name === this.step.actor);
    if (actor && !this.conversation.active) actor.label.setVisible(near && moving);
    this.marker.clear();
    if (moving && this.currentTarget) {
      const tracking = this.step.mode === 'tail' && !this.stealth?.complete;
      const target = tracking ? this.stealth?.watchers[0].actor.point ?? this.currentTarget : this.currentTarget;
      const { x, y } = target;
      const bounce = Math.round(Math.sin(time / 190) * 2);
      if (!tracking) {
        this.marker.fillStyle(0x172227, .8).fillCircle(x, y + 5, 5);
        this.marker.lineStyle(1, 0xf1c785, .92).strokeCircle(x, y + 5, 4);
      }
      this.marker.fillStyle(0xffd699, 1).fillTriangle(x - 3, y - 24 + bounce, x + 3, y - 24 + bounce, x, y - 20 + bounce);
      const dx = x - this.player.x;
      const dy = y - this.player.y;
      const direction = near ? 'Nearby' : Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'East →' : '← West' : dy > 0 ? 'South ↓' : '↑ North';
      if (direction !== this.notice) { this.notice = direction; this.presentObjective(direction); }
    }
    if (!this.roaming && moving && near && (this.step.mode === 'arrive' || this.step.mode === 'tail' && this.stealth?.complete)) void this.activate(this.step);
  }

  private updateAmbient(delta: number, moving: boolean) {
    const patrol = this.ambient;
    if (!patrol) return;
    const field = this.quest.state.field;
    const canAlert = this.townState.settings.attention && !field.ambientAlerts.includes(this.townState.mood);
    patrol.update(delta, canAlert ? this.position : { x: -1000, y: -1000 }, moving);
    if (!canAlert || !patrol.seen) return;
    field.ambientAlerts.push(this.townState.mood);
    this.field.progression.reputation(0, 6, 'A patrol noticed you in its lane');
    this.field.refresh();
    patrol.reset();
    saveCampaign(this.quest.state);
  }

  private installTestDriver() {
    this.debugSnapshot = window.render_game_to_text = () => !this.roaming && this.step.scene !== this.place ? 'null' : JSON.stringify({
      ...this.position, scene: this.place, district: this.district, chapter: this.quest.state.chapter,
      objective: this.roaming ? 'free-roam' : this.step.id, speaker: this.conversation.current?.speaker, flags: this.quest.state.flags,
      field: this.quest.state.field, choices: this.quest.state.choices, identity: this.player.identity, busy: this.busy,
      audio: audio.state, muted: audio.muted, fps: Math.round(this.game.loop.actualFps), displayObjects: this.children.length,
      suspicion: this.stealth?.suspicion, retries: this.stealth?.tries, tailReady: this.stealth?.complete
    });
    this.debugDriver = window.randuTest = {
      place: id => this.player.place(this.mark(id)),
      fieldPlace: id => {
        const site = discoveries.find(entry => entry.scene === this.place && entry.id === id);
        if (site) this.player.place(site.at);
        const [activityId, stage] = id.split(':');
        const activity = activities.find(entry => entry.id === activityId);
        if (activity && this.place === 'Town' && (stage === 'lead' || stage === 'comparison')) this.player.place(activity[stage].at);
      },
      expose: enabled => { this.exposeForTest = enabled; },
      advance: () => {
        if (!this.conversation.active) return false;
        if (this.conversation.current.choices?.length && this.hud.dialogue.querySelector('.choices button')) return 'choice';
        this.conversation.advance();
        return true;
      }
    };
  }
}
