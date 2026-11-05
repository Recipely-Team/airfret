import { PlayMode } from '@domain/instruments/play-mode';
import { CHIP, chipPlacements } from '@presentation/canvas/painters/instrument/chip-geometry';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';

const FONT_PX = { max: 15, min: 10 } as const;
/** Space kept between neighbouring pills. */
const CHIP_GAP = 4;

/**
 * Chord mode only: chord names as pills above the neck (and below for a second row), each centred on
 * the stretch of neck that selects it. Nothing covers the fingerboard itself.
 */
export function paintChordChips({ ctx, player, target, now }: PaintContext): void {
  if (player.mode !== PlayMode.chord || player.isPerforming) return;
  const l = player.layout;
  for (const s of chipPlacements(l, player.chords.length)) {
    const name = player.chords[s.index] ?? '';
    const isActive = s.index === player.slot && !player.isMuted;
    const isTarget = target?.chord === name;
    const { cx, y, isBelow } = s;
    // On a narrow neck the stretches are short: shrink the label until the pill fits its own stretch.
    const room = s.x1 - s.x0 - CHIP_GAP;
    let size: number = FONT_PX.max;
    ctx.font = `600 ${size}px ${FONT}`;
    while (size > FONT_PX.min && ctx.measureText(name).width + CHIP.padX * 2 > room) ctx.font = `600 ${--size}px ${FONT}`;
    const w = Math.min(room, ctx.measureText(name).width + CHIP.padX * 2);
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, y, w, CHIP.h, CHIP.radius);
    ctx.fillStyle = isActive ? rgba(Palette.accent, 0.95) : rgba(Palette.shade, 0.72);
    ctx.fill();
    ctx.lineWidth = isTarget ? 2 : 1;
    ctx.strokeStyle = isTarget ? rgba(Palette.accent, 0.6 + 0.4 * Math.sin(now * 6)) : rgba(Palette.ink, 0.14);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = isActive ? '#1a1408' : rgba(Palette.ink, 0.9);
    ctx.fillText(name, cx, y + CHIP.h / 2 + size / 3);
    // A hairline tick from the chip to the neck shows which stretch selects it.
    ctx.strokeStyle = rgba(isActive ? Palette.accent : Palette.ink, isActive ? 0.7 : 0.18);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s.x0 + 6, isBelow ? y - 4 : y + CHIP.h + 4);
    ctx.lineTo(s.x1 - 6, isBelow ? y - 4 : y + CHIP.h + 4);
    ctx.stroke();
  }
}
