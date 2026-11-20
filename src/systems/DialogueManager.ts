import { CAST, type Appearance } from '../entities/Npc';
import { button } from '../scenes/UIScene';
import type { Choice, Line } from '../data/dialogue';

interface DialogueOptions {
  start?: () => void;
  end?: () => void;
  choose?: (id: string) => void;
  focus?: (speaker: Line['speaker']) => void;
  tick?: () => void;
  style?: 'phone';
  portrait?: (appearance: Appearance) => string;
}
export class DialogueManager {
  private lines: Line[] = [];
  private position = 0;
  private count = 0;
  private elapsed = 0;
  private activeText?: HTMLElement;
  private choices?: HTMLElement;
  private options: DialogueOptions = {};
  constructor(private readonly panel: HTMLElement) {}
  get active() { return this.lines.length > 0; }
  get current() { return this.lines[this.position]; }
  open(lines: readonly Line[], options: DialogueOptions = {}) {
    if (!lines.length || this.active) return;
    this.lines = [...lines];
    this.options = options;
    this.position = 0;
    this.panel.hidden = false;
    this.panel.classList.toggle('phone', options.style === 'phone');
    options.start?.();
    this.show();
  }
  private show() {
    const line = this.current;
    this.count = 0;
    this.elapsed = 0;
    const name = document.createElement('span');
    name.className = 'eyebrow';
    const speaker = line.speaker in CAST ? CAST[line.speaker as keyof typeof CAST] : undefined;
    name.textContent = speaker?.name ?? (line.speaker === 'Narrator' ? 'KARIMKUNNU' : line.speaker);
    const row = document.createElement('div');
    row.className = 'speaker';
    if ((speaker || line.speaker === 'Unknown Officer') && this.options.portrait) {
      const portrait = document.createElement('img');
      portrait.className = 'portrait';
      portrait.alt = '';
      portrait.src = this.options.portrait(line.speaker as Appearance);
      row.append(portrait);
    }
    row.append(name);
    this.activeText = document.createElement('p');
    this.activeText.setAttribute('aria-label', line.text);
    this.choices = document.createElement('div');
    this.choices.className = 'choices';
    const advance = button('Continue  ›', () => this.advance(), 'advance');
    advance.setAttribute('aria-label', 'Advance dialogue');
    this.panel.replaceChildren();
    if (this.options.style === 'phone') {
      const header = document.createElement('div');
      header.className = 'phone-channel';
      header.textContent = 'Secure messages · Alex / Raghavan';
      this.panel.append(header);
    }
    this.panel.append(row, this.activeText, this.choices, advance);
    this.options.focus?.(line.speaker);
  }
  update(delta: number) {
    if (!this.active || this.count >= this.current.text.length) return;
    this.elapsed += delta;
    const next = Math.min(this.current.text.length, Math.floor(this.elapsed / 17));
    if (next > this.count) this.reveal(next);
  }
  private reveal(count: number) {
    this.count = count;
    this.activeText!.textContent = this.current.text.slice(0, count);
    if (count < this.current.text.length || !this.current.choices?.length || this.choices!.childElementCount) return;
    for (const choice of this.current.choices) this.choices!.append(button(choice.text, () => this.choose(choice)));
    this.panel.querySelector<HTMLButtonElement>('.advance')!.hidden = true;
  }
  advance() {
    if (!this.active) return;
    if (this.count < this.current.text.length) { this.reveal(this.current.text.length); this.options.tick?.(); return; }
    if (this.current.choices?.length) { this.choices!.querySelector('button')?.focus(); return; }
    this.next();
  }
  private choose(choice: Choice) {
    this.options.choose?.(choice.id);
    this.lines.splice(this.position + 1, 0, ...choice.response);
    this.next();
  }
  private next() {
    this.options.tick?.();
    this.position++;
    if (this.position < this.lines.length) { this.show(); return; }
    const end = this.options.end;
    this.close();
    end?.();
  }
  close() {
    this.lines = [];
    this.options = {};
    this.panel.hidden = true;
    this.panel.replaceChildren();
  }
}
