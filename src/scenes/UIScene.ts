import Phaser from 'phaser';
import type { Chapter } from '../data/chapters';

export function interfaceRoot(): HTMLElement { return document.querySelector<HTMLElement>('#interface')!; }
export function button(text: string, action: () => void, className = '') {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = text;
  element.className = className;
  element.addEventListener('click', action);
  return element;
}

export class UI {
  readonly root = document.createElement('section');
  readonly quest: HTMLElement;
  readonly prompt: HTMLButtonElement;
  readonly dialogue: HTMLElement;
  readonly caption: HTMLElement;
  readonly suspicion: HTMLElement;
  readonly district: HTMLElement;
  readonly vignette: HTMLElement;
  readonly pausePanel: HTMLElement;
  readonly utility: HTMLElement;
  readonly touch: HTMLElement;
  private districtTimer = 0;
  constructor(onInteract: () => void) {
    this.root.className = 'game-ui';
    this.root.innerHTML = `
      <div class="vignette"></div>
      <aside class="objective" hidden></aside>
      <div class="utility"></div>
      <div class="district" aria-live="polite" hidden></div>
      <div class="suspicion" hidden><span></span><meter min="0" max="1" value="0"></meter></div>
      <div class="touch"></div>
      <div class="dialogue" hidden></div>
      <div class="cinematic" hidden></div>
      <div class="pause-layer" hidden></div>`;
    this.quest = this.root.querySelector('.objective')!;
    this.dialogue = this.root.querySelector('.dialogue')!;
    this.caption = this.root.querySelector('.cinematic')!;
    this.suspicion = this.root.querySelector('.suspicion')!;
    this.district = this.root.querySelector('.district')!;
    this.vignette = this.root.querySelector('.vignette')!;
    this.pausePanel = this.root.querySelector('.pause-layer')!;
    this.utility = this.root.querySelector('.utility')!;
    this.touch = this.root.querySelector('.touch')!;
    this.prompt = button('', onInteract, 'interaction');
    this.prompt.hidden = true;
    this.root.append(this.prompt);

  }
  setObjective(chapter: string, goal: string, hint?: string) {
    const tag = document.createElement('span');
    tag.className = 'eyebrow';
    tag.textContent = chapter;
    const headline = document.createElement('strong');
    headline.textContent = goal;
    this.quest.replaceChildren(tag, headline);
    if (hint) {
      const sub = document.createElement('small');
      sub.textContent = hint;
      this.quest.append(sub);
    }
    this.quest.hidden = false;
  }
  showChapterIntro(chapter: Chapter, begin: () => void) {
    const overlay = document.createElement('section');
    overlay.className = 'story-overlay chapter-intro';
    overlay.dataset.chapter = String(chapter.id);
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'story-chapter-heading');
    const panel = document.createElement('div');
    panel.className = 'story-panel';
    const heading = document.createElement('h2');
    heading.id = 'story-chapter-heading';
    heading.textContent = `Chapter ${chapter.id} — ${chapter.title}`;
    heading.tabIndex = -1;
    const recap = document.createElement('p');
    recap.className = 'chapter-recap';
    recap.textContent = chapter.description;
    const objective = document.createElement('p');
    objective.className = 'chapter-next';
    const label = document.createElement('span');
    label.className = 'eyebrow';
    label.textContent = 'Next objective';
    objective.append(label, chapter.objectives.find(step => step.mode !== 'auto')?.goal ?? chapter.objectives[0].goal);
    const background = Array.from(this.root.children).filter((node): node is HTMLElement => node instanceof HTMLElement && !node.inert);
    for (const node of background) node.inert = true;
    const start = button('Start Chapter', () => {
      overlay.remove();
      for (const node of background) node.inert = false;
      begin();
    }, 'menu-button primary');
    panel.append(heading, recap, objective, start);
    overlay.append(panel);
    this.root.append(overlay);
    heading.focus();
  }
  setDistrict(title: string) {
    this.district.textContent = title;
    this.district.hidden = false;
    window.clearTimeout(this.districtTimer);
    this.districtTimer = window.setTimeout(() => this.district.hidden = true, 2500);
  }
  setSuspicion(value?: number, warning = .7) {
    this.suspicion.hidden = value === undefined;
    if (value === undefined) return;
    this.suspicion.querySelector('span')!.textContent = value > warning ? 'ABOUT TO BE SEEN' : value > 0 ? 'SUSPICION' : 'UNSEEN';
    this.suspicion.querySelector('meter')!.value = value;
    this.suspicion.classList.toggle('alert', value > warning);
  }
  destroy() { window.clearTimeout(this.districtTimer); this.root.remove(); }
}

export class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }
  create() {
    const mount = (node: HTMLElement) => interfaceRoot().append(node);
    this.game.events.on('hud:mount', mount);
    this.events.once('shutdown', () => this.game.events.off('hud:mount', mount));
  }
}
