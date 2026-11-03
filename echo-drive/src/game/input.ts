export class Controls {
  private keys = new Set<string>();
  constructor() {
    window.addEventListener('keydown', e => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.clear());
  }
  clear() { this.keys.clear(); }
  read() {
    const pressed = (...codes: string[]) => codes.some(code => this.keys.has(code));
    return {
      throttle: Number(pressed('KeyW','ArrowUp')) - Number(pressed('KeyS','ArrowDown')),
      steer: Number(pressed('KeyD','ArrowRight')) - Number(pressed('KeyA','ArrowLeft')),
      brake: pressed('KeyB'), handbrake: pressed('Space'),
    };
  }
}
