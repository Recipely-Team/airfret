import type { DrumPlayer } from '@application/drums/drum-player';
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
 * - A held pointer is fed every frame, not only when it moves, so a finger resting on a string stops it.
 */
export class PointerInput {
  private down = false;
  private last: { x: number; y: number } | null = null;
  private frame = 0;

  constructor(canvas: HTMLCanvasElement, player: Player, sound: SoundOutputInterface, drums: DrumPlayer, isDrums: () => boolean) {
    const now = () => performance.now() / 1000;
    const at = (e: PointerEvent) => ({ x: e.clientX, y: e.clientY });
    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (isDrums()) {
        drums.click(at(e), sound.now, now());
        return;
      }
      this.down = true;
      canvas.setPointerCapture(e.pointerId);
      this.last = at(e);
      player.pointer(this.last, now(), sound.now);
      const hold = () => {
        if (!this.down || !this.last) return;
        player.pointer(this.last, now(), sound.now);
        this.frame = requestAnimationFrame(hold);
      };
      this.frame = requestAnimationFrame(hold);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (isDrums()) return;
      if (!this.down) return;
      this.last = at(e);
      player.pointer(this.last, now(), sound.now);
    });
    const up = () => {
      if (!this.down) return;
      this.down = false;
      this.last = null;
      cancelAnimationFrame(this.frame);
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
