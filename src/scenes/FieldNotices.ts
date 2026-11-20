export class FieldNotices {
  private readonly view = document.createElement('output');
  private timer = 0;
  private lines: string[] = [];
  constructor(root: HTMLElement, private readonly quiet: () => boolean) {
    this.view.className = 'field-notice';
    this.view.setAttribute('aria-live', 'polite');
    this.view.hidden = true;
    root.append(this.view);
  }
  push(message: string) {
    if (this.quiet()) return;
    this.lines = [...this.lines.slice(-2), message];
    this.view.textContent = this.lines.join('\n');
    this.view.hidden = false;
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.clear(), 4200);
  }
  clear() {
    window.clearTimeout(this.timer);
    this.lines = [];
    this.view.hidden = true;
  }
}
