import { byId } from '@presentation/ui/dom';

const DEFAULT_MS = 3000;

/** A transient message at the bottom of the screen. */
export class Toast {
  private readonly el = byId('toast');
  private timer = 0;

  show(message: string, ms = DEFAULT_MS): void {
    this.el.textContent = message;
    this.el.hidden = false;
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => (this.el.hidden = true), ms);
  }
}
