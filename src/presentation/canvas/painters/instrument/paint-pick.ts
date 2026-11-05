import { PlayMode } from '@domain/instruments/play-mode';
import { StrikeSurface } from '@domain/gesture/strike-surface';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';
import { t } from '@presentation/i18n/translator';

const RING = 9;
const TRAIL_SECONDS = 0.25;

/**
 * The playing point (index fingertip) with a fading trail, what part of the finger strikes
 * (nail / pad, or ✕ when the finger can't play), palm-mute state, and in free mode the chord name.
 */
export function paintPick({ ctx, player, now }: PaintContext): void {
  const l = player.layout;
  player.trail.forEach((cur, i) => {
    const prev = player.trail[i - 1];
    if (!prev) return;
    const a = Math.min(1, Math.max(0, 1 - (now - cur.t) / TRAIL_SECONDS));
    ctx.strokeStyle = rgba(Palette.ink, 0.35 * a);
    ctx.lineWidth = 2.5 * a + 0.5;
    ctx.beginPath();
    ctx.moveTo(prev.p.x, prev.p.y);
    ctx.lineTo(cur.p.x, cur.p.y);
    ctx.stroke();
  });
  const p = player.strumPoint;
  if (p) {
    const isOff = player.strike === StrikeSurface.none;
    ctx.strokeStyle = isOff ? rgba(Palette.miss, 0.9) : rgba(Palette.ink, 0.85);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, RING, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = `500 11px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = isOff ? rgba(Palette.miss, 0.9) : rgba(Palette.ink, 0.6);
    const label = player.isPalmMuted ? t('strike.palm') : t(`strike.${player.strike}`);
    ctx.fillText(label, p.x + RING + 6, p.y + 4);
  }
  if ((player.mode === PlayMode.free || player.isPerforming) && player.lastChordName) {
    ctx.font = `600 34px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(Palette.ink, 0.9);
    ctx.fillText(player.lastChordName, (l.nutX + l.neckEndX) / 2, l.centerY - l.spreadBody - l.h * 0.09);
  }
}
