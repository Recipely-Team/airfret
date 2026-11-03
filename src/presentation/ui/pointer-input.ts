import type { Player } from '@application/play/player';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { PlayMode } from '@domain/instruments/play-mode';

const DIGIT = /^[0-9]$/;
/** Key "0" selects the tenth chord box. */
const ZERO_SLOT = 9;

/**
 * **PointerInput** — mouse/touch strumming and number-key selection, for playing without a camera.
 *
 * @remarks
 * - While the pointer is down it is the strumming hand; camera strumming pauses.
 */
export class PointerInput {
  private down = false;

  constructor(canvas: HTMLCanvasElement, player: Player, sound: SoundOutputInterface) {
    const now = () => performance.now() / 1000;
    const at = (e: PointerEvent) => ({ x: e.clientX, y: e.clientY });
    canvas.addEventListener('pointerdown', (e) => {
      this.down = true;
      canvas.setPointerCapture(e.pointerId);
      player.pointer(at(e), now(), sound.now);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (this.down) player.pointer(at(e), now(), sound.now);
    });
    const up = () => {
      this.down = false;
      player.pointer(null, now(), sound.now);
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    window.addEventListener('keydown', (e) => {
      const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement;
      if (isTyping || !DIGIT.test(e.key)) return;
      const n = Number(e.key);
      player.select(player.mode === PlayMode.chord ? (n === 0 ? ZERO_SLOT : n - 1) : n);
    });
  }

  get isDown(): boolean {
    return this.down;
  }
}
