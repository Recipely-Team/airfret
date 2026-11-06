import type { DarbukaPlayer } from '@application/drums/darbuka-player';
import { DrumPiece } from '@domain/drums/drum-piece';
import { DARBUKA_EDGE } from '@domain/drums/hand/darbuka-pad';
import { FONT, Palette, rgba } from '@presentation/canvas/palette';
import { t } from '@presentation/i18n/translator';

/** Hammered copper body, a pale synthetic head, a chrome rim. */
const COLOURS = { body: '#8a5232', bodyLight: '#c98a55', head: '#efe6d2', headShade: '#d6c9ab', rim: '#d8d8da', rimDark: '#7c7c80' } as const;
const RIPPLE_SECONDS = 0.6;
const BODY_DEPTH_OF_RADIUS = 1.15;

/**
 * The darbuka from the player's seat: its goblet body narrowing below the head, the head inside a chrome rim,
 * a faint ring where the edge strokes begin, the strokes' names where they are played, and a ripple for each
 * stroke — accent for düm, pale for tek and ka.
 */
export function paintDarbuka(ctx: CanvasRenderingContext2D, d: DarbukaPlayer, now: number): void {
  const { cx, cy, rx, ry } = d.pad;
  // Body: the goblet below the head, wide at the head, narrowing to the neck.
  const depth = rx * BODY_DEPTH_OF_RADIUS;
  const body = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
  body.addColorStop(0, COLOURS.body);
  body.addColorStop(0.45, COLOURS.bodyLight);
  body.addColorStop(1, COLOURS.body);
  ctx.beginPath();
  ctx.moveTo(cx - rx, cy);
  ctx.bezierCurveTo(cx - rx, cy + depth * 0.55, cx - rx * 0.32, cy + depth * 0.6, cx - rx * 0.28, cy + depth);
  ctx.lineTo(cx + rx * 0.28, cy + depth);
  ctx.bezierCurveTo(cx + rx * 0.32, cy + depth * 0.6, cx + rx, cy + depth * 0.55, cx + rx, cy);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  // Head inside the rim.
  const head = ctx.createRadialGradient(cx - rx * 0.2, cy - ry * 0.3, rx * 0.1, cx, cy, rx);
  head.addColorStop(0, COLOURS.head);
  head.addColorStop(1, COLOURS.headShade);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = head;
  ctx.fill();
  ctx.lineWidth = Math.max(4, rx * 0.045);
  ctx.strokeStyle = COLOURS.rim;
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = COLOURS.rimDark;
  ctx.stroke();
  // Where the edge begins.
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * DARBUKA_EDGE, ry * DARBUKA_EDGE, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(80, 60, 40, 0.25)';
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `500 ${Math.max(12, rx * 0.07)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(70, 50, 30, 0.55)';
  ctx.fillText(t('darbuka.doum'), cx, cy + 5);
  ctx.fillText(t('darbuka.ka'), cx - rx * 0.82, cy + 5);
  ctx.fillText(t('darbuka.tek'), cx + rx * 0.82, cy + 5);
  for (const r of d.visibleRipples(now)) {
    const age = (now - r.at) / RIPPLE_SECONDS;
    const size = (r.piece === DrumPiece.doum ? rx * 0.5 : rx * 0.25) * (0.3 + age);
    ctx.beginPath();
    ctx.ellipse(r.x, r.y, size, size * (ry / rx), 0, 0, Math.PI * 2);
    ctx.strokeStyle = r.piece === DrumPiece.doum ? rgba(Palette.accent, (1 - age) * r.velocity) : `rgba(255,255,255,${(1 - age) * r.velocity})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}
