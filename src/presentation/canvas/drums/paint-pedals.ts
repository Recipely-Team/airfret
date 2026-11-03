import type { DrumPlayer } from '@application/drums/drum-player';
import type { InputBinding } from '@domain/input/input-binding';
import { PedalAction } from '@domain/input/pedal-action';
import type { PedalBindings } from '@domain/input/pedal-bindings';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';
import { bindingLabel } from '@presentation/ui/drums/binding-label';
import { t } from '@presentation/i18n/translator';

const PEDAL = { w: 64, h: 92, gap: 18, bottom: 26 } as const;

/** Foot pedals at the bottom: lit while pressed, labelled with the inputs bound to them. */
export function paintPedals(ctx: CanvasRenderingContext2D, drums: DrumPlayer, bindings: PedalBindings, w: number, h: number): void {
  const actions = [PedalAction.hihatPedal, PedalAction.kick, PedalAction.kick2];
  const total = actions.length * PEDAL.w + (actions.length - 1) * PEDAL.gap;
  actions.forEach((action, i) => {
    const x = (w - total) / 2 + i * (PEDAL.w + PEDAL.gap);
    const y = h - PEDAL.h - PEDAL.bottom;
    const isDown = drums.pedalDown.has(action);
    ctx.beginPath();
    ctx.roundRect(x, y + (isDown ? 6 : 0), PEDAL.w, PEDAL.h - (isDown ? 6 : 0), 10);
    const metal = ctx.createLinearGradient(x, 0, x + PEDAL.w, 0);
    metal.addColorStop(0, '#3b3c41');
    metal.addColorStop(0.5, isDown ? '#9a9ba2' : '#6e7077');
    metal.addColorStop(1, '#3b3c41');
    ctx.fillStyle = metal;
    ctx.fill();
    ctx.strokeStyle = isDown ? rgba(Palette.accent, 0.95) : rgba(Palette.ink, 0.15);
    ctx.lineWidth = isDown ? 2 : 1;
    ctx.stroke();
    ctx.font = `600 10px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(Palette.ink, 0.85);
    ctx.fillText(t(`pedal.${action}`), x + PEDAL.w / 2, y - 8);
    ctx.font = `500 10px ${FONT}`;
    ctx.fillStyle = rgba(Palette.ink, 0.6);
    const first: InputBinding | undefined = bindings[action][0];
    const label = first ? bindingLabel(first) : '—';
    ctx.fillText(label, x + PEDAL.w / 2, y + PEDAL.h / 2 + 4);
  });
}
