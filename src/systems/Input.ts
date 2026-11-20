export type Direction = 'up' | 'down' | 'left' | 'right';
export type InputAction = 'interact' | 'advance' | 'pause' | 'mute';
const directionByCode: Record<string, Direction> = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right'
};
const actionByCode: Record<string, InputAction> = { KeyE: 'interact', Space: 'advance', Escape: 'pause', KeyM: 'mute' };

export class Input {
  private keys = new Set<string>();
  private virtual = new Map<number, Direction>();
  private readonly controller = new AbortController();
  constructor(private readonly action: (action: InputAction) => void, private readonly activate = () => {}) {
    const signal = this.controller.signal;
    window.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLButtonElement && event.code === 'Space') return;
      const direction = directionByCode[event.code];
      const action = actionByCode[event.code];
      if (!direction && !action) return;
      event.preventDefault();
      this.activate();
      if (direction) this.keys.add(event.code);
      if (action && !event.repeat) this.action(action);
    }, { signal });
    window.addEventListener('keyup', event => this.keys.delete(event.code), { signal });
    window.addEventListener('blur', () => this.clear(), { signal });
    document.addEventListener('visibilitychange', () => this.clear(), { signal });
  }
  get x() { return Number(this.held('right')) - Number(this.held('left')); }
  get y() { return Number(this.held('down')) - Number(this.held('up')); }
  private held(direction: Direction) {
    for (const code of this.keys) if (directionByCode[code] === direction) return true;
    for (const held of this.virtual.values()) if (held === direction) return true;
    return false;
  }
  press(action: InputAction) { this.activate(); this.action(action); }
  bind(button: HTMLButtonElement, direction: Direction) {
    const signal = this.controller.signal;
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      this.activate();
      button.setPointerCapture(event.pointerId);
      this.virtual.set(event.pointerId, direction);
      button.dataset.held = 'true';
    }, { signal });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(type, event => {
        this.virtual.delete((event as PointerEvent).pointerId);
        delete button.dataset.held;
      }, { signal });
    }
  }
  clear() {
    this.keys.clear();
    this.virtual.clear();
    document.querySelectorAll('.d-pad button[data-held]').forEach(key => key.removeAttribute('data-held'));
  }
  destroy() { this.clear(); this.controller.abort(); }
}
