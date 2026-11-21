import Phaser from 'phaser';
import { chapters } from '../data/chapters';
import { town } from '../data/maps/town';
import { newCampaign, type Campaign } from '../systems/QuestManager';
import { debugCampaign, loadCampaign, saveCampaign } from '../systems/Save';
import { button, interfaceRoot } from './UIScene';
import { renderWorld } from './WorldView';
import { characterCards, characterPortrait } from './CharacterProfiles';
import { Npc } from '../entities/Npc';
import { renderChallengeBoard } from './ChallengeBoard';
import type { ChallengeLaunch } from './ChallengeScene';
import { audio } from '../systems/Audio';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    audio.stopAmbience();
    renderWorld(this, town);
    this.cameras.main.setBackgroundColor('#18222b').setZoom(3).centerOn(500, 235);
    new Npc(this, 'Alex', { x: 574, y: 180 });
    new Npc(this, 'Vishnu', { x: 544, y: 240 });
    const poster = document.createElement('section');
    poster.className = 'title-screen';
    poster.innerHTML = `<div class="title-inner">
      <p class="eyebrow">Karimkunnu, Kerala</p>
      <h1>Randu<br>Chaaran</h1>
      <div class="subtitle">Two Spies</div>
      <div class="title-rule"></div>
      <nav aria-label="Title menu"></nav>
      <div class="menu-help" hidden></div>
    </div>`;
    const nav = poster.querySelector('nav')!;
    const help = poster.querySelector<HTMLElement>('.menu-help')!;
    const saved = loadCampaign();
    const open = (state: Campaign) => this.scene.start(chapters[state.chapter - 1].objectives[state.objective].scene, state);
    const newGame = () => {
      audio.unlock();
      const params = new URLSearchParams(location.search);
      const sample = import.meta.env.DEV && params.has('interaction');
      const selected = import.meta.env.DEV ? Number(params.get('chapter')) : 0;
      const chapter = chapters[selected - 1];
      const step = chapter ? Phaser.Math.Clamp(Math.floor(Number(params.get('step'))) || 0, 0, chapter.objectives.length - 1) : 0;
      const state = sample ? debugCampaign(2, 2) : chapter ? debugCampaign(chapter.id, step) : newCampaign();
      if (sample) state.position = town.marks.shopkeeper;
      const roster = document.createElement('section');
      roster.className = 'story-overlay roster-screen';
      roster.setAttribute('role', 'dialog');
      roster.setAttribute('aria-modal', 'true');
      roster.setAttribute('aria-labelledby', 'karimkunnu-roster');
      const panel = document.createElement('div');
      panel.className = 'story-panel';
      const title = document.createElement('h2');
      title.id = 'karimkunnu-roster';
      title.textContent = 'MEET THE PEOPLE OF KARIMKUNNU';
      const cards = characterCards(id => characterPortrait(this, id));
      const begin = button('Begin Story', () => {
        begin.disabled = true;
        saveCampaign(state);
        open(state);
      }, 'menu-button primary');
      const actions = document.createElement('div');
      actions.className = 'story-actions';
      const back = button('Back to title', () => {
        roster.remove();
        poster.hidden = false;
        nav.querySelector('button')?.focus();
      }, 'menu-button');
      actions.append(back, begin);
      panel.append(title, cards, actions);
      roster.append(panel);
      poster.hidden = true;
      interfaceRoot().append(roster);
      this.events.once('shutdown', () => roster.remove());
      title.tabIndex = -1;
      title.focus();
    };
    const continueButton = button('Continue', () => {
      if (!saved) return;
      audio.unlock();
      if (saved.finished) this.scene.start('Credits', { ending: true });
      else open(saved.campaign);
    }, 'menu-button');
    continueButton.disabled = !saved;
    nav.append(button('New Game', newGame, 'menu-button primary'), continueButton,
      button('Controls', () => {
        help.hidden = !help.hidden && !help.classList.contains('title-records');
        help.classList.remove('title-records');
        help.textContent = 'WASD or arrows to move · E to interact · E or Space to read · Esc to pause · M to mute · J for the Case File. On touchscreens, use the D-pad and action buttons.';
      }, 'menu-button'), button('Challenge Records', () => {
        help.hidden = false;
        help.replaceChildren();
        help.classList.add('title-records');
        renderChallengeBoard(help, saved?.campaign, id => {
          audio.unlock();
          const launch: ChallengeLaunch = {
            id, identity: saved?.campaign.identity ?? 'Alex', difficulty: (saved?.campaign.chapter ?? 0) >= 6 ? 5 : 0,
            done: () => this.scene.start('Title')
          };
          this.scene.start('Challenge', launch);
        }, true);
      }, 'menu-button'), button('Credits', () => this.scene.start('Credits'), 'menu-button'));
    interfaceRoot().append(poster);
    this.events.once('shutdown', () => poster.remove());
  }
}
