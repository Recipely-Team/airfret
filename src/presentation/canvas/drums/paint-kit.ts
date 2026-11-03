import type { DrumPlayer } from '@application/drums/drum-player';
import type { DrumPad } from '@domain/drums/drum-pad';
import { DrumPiece } from '@domain/drums/drum-piece';

const SHELL = { wrap: '#1c2230', light: '#3a4458', dark: '#0b0e14' } as const;
const HEAD = { coated: '#efece4', shade: '#c9c4b8' } as const;
const BRONZE = { light: '#e2c27a', mid: '#b88d3e', dark: '#6f5220' } as const;
const CHROME = '#d9d9dc';
const SHELL_DEPTH_OF_RX = 0.55;
const WOBBLE = { hz: 5, decay: 3.5, depth: 0.35 } as const;
const RIPPLE_SECONDS = 0.35;
const HAT_GAP_OPEN = 10;
const LUGS = 8;

/** The whole kit: stands, shells, heads with hit ripples, cymbals that wobble when struck. */
export function paintKit(ctx: CanvasRenderingContext2D, drums: DrumPlayer, now: number, h: number): void {
  const byPiece = (p: DrumPiece) => drums.pads.find((x) => x.piece === p);
  const kick = byPiece(DrumPiece.kick);
  if (kick) paintKick(ctx, kick, drums, now);
  // Back to front: cymbals (stands first), then drums by height on screen.
  for (const pad of drums.pads.filter((p) => p.isCymbal)) paintStand(ctx, pad, h);
  for (const pad of [...drums.pads].filter((p) => p.piece !== DrumPiece.kick).sort((a, b) => a.cy - b.cy)) {
    if (pad.isCymbal) paintCymbal(ctx, pad, drums, now);
    else paintDrum(ctx, pad, drums, now);
  }
}

function hitAge(drums: DrumPlayer, piece: DrumPiece, now: number): { age: number; velocity: number } {
  const hit = drums.lastHit.get(piece);
  return hit ? { age: now - hit.at, velocity: hit.velocity } : { age: Infinity, velocity: 0 };
}

function paintDrum(ctx: CanvasRenderingContext2D, pad: DrumPad, drums: DrumPlayer, now: number): void {
  const depth = pad.rx * SHELL_DEPTH_OF_RX;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 14;
  const wrap = ctx.createLinearGradient(pad.cx - pad.rx, 0, pad.cx + pad.rx, 0);
  wrap.addColorStop(0, SHELL.dark);
  wrap.addColorStop(0.35, SHELL.light);
  wrap.addColorStop(0.6, SHELL.wrap);
  wrap.addColorStop(1, SHELL.dark);
  ctx.beginPath();
  ctx.ellipse(pad.cx, pad.cy + depth, pad.rx, pad.ry, 0, 0, Math.PI);
  ctx.lineTo(pad.cx - pad.rx, pad.cy);
  ctx.ellipse(pad.cx, pad.cy, pad.rx, pad.ry, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fillStyle = wrap;
  ctx.fill();
  ctx.restore();
  // Chrome lugs around the shell.
  for (let i = 0; i < LUGS; i++) {
    const a = Math.PI * ((i + 0.5) / LUGS);
    const x = pad.cx - Math.cos(a) * pad.rx * 0.98;
    ctx.fillStyle = CHROME;
    ctx.fillRect(x - 2.5, pad.cy + Math.sin(a) * pad.ry + depth * 0.25, 5, depth * 0.45);
  }
  const { age, velocity } = hitAge(drums, pad.piece, now);
  const head = ctx.createRadialGradient(pad.cx - pad.rx * 0.2, pad.cy - pad.ry * 0.3, pad.rx * 0.05, pad.cx, pad.cy, pad.rx);
  head.addColorStop(0, age < 0.08 ? '#ffffff' : HEAD.coated);
  head.addColorStop(1, HEAD.shade);
  ctx.beginPath();
  ctx.ellipse(pad.cx, pad.cy, pad.rx, pad.ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = head;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = CHROME;
  ctx.stroke();
  if (age < RIPPLE_SECONDS) {
    const k = age / RIPPLE_SECONDS;
    ctx.beginPath();
    ctx.ellipse(pad.cx, pad.cy, pad.rx * (0.2 + 0.8 * k), pad.ry * (0.2 + 0.8 * k), 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(80,70,55,${0.35 * velocity * (1 - k)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function paintCymbal(ctx: CanvasRenderingContext2D, pad: DrumPad, drums: DrumPlayer, now: number): void {
  const { age, velocity } = hitAge(drums, pad.piece, now);
  const wobble = Number.isFinite(age) ? Math.sin(age * WOBBLE.hz * Math.PI * 2) * Math.exp(-age * WOBBLE.decay) * WOBBLE.depth * velocity : 0;
  const isHat = pad.piece === DrumPiece.hihat;
  const layers = isHat ? [drums.isHatOpen ? -HAT_GAP_OPEN : -3, 0] : [0];
  for (const dy of layers) {
    const ry = pad.ry * (1 + wobble);
    const y = pad.cy + dy;
    const bronze = ctx.createRadialGradient(pad.cx - pad.rx * 0.25, y - ry * 0.4, pad.rx * 0.05, pad.cx, y, pad.rx);
    bronze.addColorStop(0, BRONZE.light);
    bronze.addColorStop(0.55, BRONZE.mid);
    bronze.addColorStop(1, BRONZE.dark);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 10;
    ctx.beginPath();
    ctx.ellipse(pad.cx, y, pad.rx, ry, wobble * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = bronze;
    ctx.fill();
    ctx.restore();
    // Lathe rings.
    ctx.strokeStyle = 'rgba(60,40,10,0.18)';
    ctx.lineWidth = 1;
    for (let k = 0.25; k < 1; k += 0.12) {
      ctx.beginPath();
      ctx.ellipse(pad.cx, y, pad.rx * k, ry * k, wobble * 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(pad.cx, y - ry * 0.12, pad.rx * 0.16, ry * 0.32, 0, 0, Math.PI * 2);
    ctx.fillStyle = BRONZE.light;
    ctx.fill();
  }
}

function paintStand(ctx: CanvasRenderingContext2D, pad: DrumPad, h: number): void {
  ctx.strokeStyle = 'rgba(200,200,205,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pad.cx, pad.cy);
  ctx.lineTo(pad.cx, h * 0.98);
  ctx.moveTo(pad.cx, h * 0.9);
  ctx.lineTo(pad.cx - 40, h * 0.99);
  ctx.moveTo(pad.cx, h * 0.9);
  ctx.lineTo(pad.cx + 40, h * 0.99);
  ctx.stroke();
}

function paintKick(ctx: CanvasRenderingContext2D, pad: DrumPad, drums: DrumPlayer, now: number): void {
  const { age } = hitAge(drums, DrumPiece.kick, now);
  const r = pad.rx * (age < 0.06 ? 1.01 : 1);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 16;
  ctx.beginPath();
  ctx.arc(pad.cx, pad.cy, r, 0, Math.PI * 2);
  ctx.fillStyle = SHELL.wrap;
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 7;
  ctx.strokeStyle = SHELL.light;
  ctx.stroke();
  const head = ctx.createRadialGradient(pad.cx, pad.cy - r * 0.3, r * 0.1, pad.cx, pad.cy, r * 0.92);
  head.addColorStop(0, '#2b3142');
  head.addColorStop(1, '#10131b');
  ctx.beginPath();
  ctx.arc(pad.cx, pad.cy, r * 0.92, 0, Math.PI * 2);
  ctx.fillStyle = head;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(pad.cx + r * 0.42, pad.cy + r * 0.35, r * 0.13, 0, Math.PI * 2);
  ctx.fillStyle = '#05070a';
  ctx.fill();
}
