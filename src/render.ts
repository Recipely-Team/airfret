// Canvas overlay: virtual instrument, hands, lesson timeline.

import type { Lesson } from './lesson/lesson';
import { chordNotes, findPosition, midiToName, pitchClass } from './music/theory';
import { chordGrid, chordSlots, spreadAt, strumStringYs, stringY, type Layout } from './play/layout';
import type { Player } from './play/player';
import { t } from './i18n';
import type { Point } from './tracking';

const C = {
  ink: '236, 232, 225',
  accent: '224, 164, 88',
  miss: '196, 103, 90',
  shade: '9, 9, 10',
};
const rgba = (c: string, a: number) => `rgba(${c}, ${a})`;
const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private phase = 0;
  private lastT = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  resize(w: number, h: number): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  draw(player: Player, lesson: Lesson | null, audioNow: number, now: number, showHint: string | null): void {
    const { ctx } = this;
    const l = player.layout;
    const dt = this.lastT ? Math.min(0.05, now - this.lastT) : 0;
    this.lastT = now;
    this.phase += dt;
    for (let i = 0; i < player.energy.length; i++) player.energy[i] *= Math.exp(-dt * 3.2);

    ctx.clearRect(0, 0, l.w, l.h);
    // Calm the camera image where the instrument sits so the strings read.
    const g = ctx.createLinearGradient(0, l.centerY - l.h * 0.35, 0, l.centerY + l.h * 0.4);
    g.addColorStop(0, rgba(C.shade, 0));
    g.addColorStop(0.5, rgba(C.shade, 0.35));
    g.addColorStop(1, rgba(C.shade, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l.w, l.h);

    const target = lesson ? this.currentTarget(lesson, audioNow) : null;

    this.drawBody(l);
    this.drawNeck(player, target);
    this.drawStrings(player, target);
    this.drawHands(player);
    if (lesson) this.drawHighway(lesson, player, audioNow, now);
    if (player.mode === 'chord' && player.instrument.tuning.length === 6) {
      this.drawDiagram(player.chord ?? '', player.muted, l);
    }
    if (showHint) {
      ctx.font = `400 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(C.ink, 0.6);
      ctx.fillText(showHint, l.w / 2, l.centerY + l.spreadBody + l.h * 0.17);
    }
  }

  private currentTarget(lesson: Lesson, audioNow: number): { chord?: string; midi?: number } | null {
    const nt = lesson.nextTarget;
    if (!nt) return null;
    const beat = lesson.beatAt(audioNow);
    // Show the next target a little ahead so the hand has time to move.
    if (nt.beat - beat > 2.5 && nt.chord === undefined) return null;
    return { chord: nt.chord, midi: nt.midi };
  }

  private drawBody(l: Layout): void {
    const { ctx } = this;
    const x0 = Math.min(l.strumX0, l.strumX1);
    const x1 = Math.max(l.strumX0, l.strumX1);
    const cx = (x0 + x1) / 2;
    const r = l.spreadBody * 1.75;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, l.centerY, (x1 - x0) / 2 + l.w * 0.02, r, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgba(C.shade, 0.42);
    ctx.fill();
    ctx.strokeStyle = rgba(C.ink, 0.1);
    ctx.lineWidth = 1;
    ctx.stroke();
    // Bridge.
    const bx = l.strumX1;
    ctx.fillStyle = rgba(C.ink, 0.22);
    ctx.fillRect(bx - 2, l.centerY - l.spreadBody - 10, 4, l.spreadBody * 2 + 20);
    ctx.restore();
  }

  private drawNeck(player: Player, target: { chord?: string; midi?: number } | null): void {
    const { ctx } = this;
    const l = player.layout;
    const pad = l.h * 0.03;
    const topAt = (x: number) => l.centerY - spreadAt(l, x) - pad;
    const botAt = (x: number) => l.centerY + spreadAt(l, x) + pad;

    // Fingerboard.
    ctx.beginPath();
    ctx.moveTo(l.nutX, topAt(l.nutX));
    ctx.lineTo(l.neckEndX, topAt(l.neckEndX));
    ctx.lineTo(l.neckEndX, botAt(l.neckEndX));
    ctx.lineTo(l.nutX, botAt(l.nutX));
    ctx.closePath();
    ctx.fillStyle = rgba(C.shade, 0.5);
    ctx.fill();
    ctx.strokeStyle = rgba(C.ink, 0.12);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Nut.
    ctx.fillStyle = rgba(C.ink, 0.5);
    ctx.fillRect(l.nutX - 2, topAt(l.nutX), 4, botAt(l.nutX) - topAt(l.nutX));

    if (player.mode === 'chord') {
      this.drawChordSlots(player, target?.chord);
    } else {
      this.drawFrets(player, target?.midi);
    }
  }

  private drawFrets(player: Player, targetMidi?: number): void {
    const { ctx } = this;
    const l = player.layout;
    const pos = targetMidi !== undefined ? findPosition(targetMidi, player.instrument.tuning, l.maxFret) : null;
    for (let n = 1; n <= l.maxFret; n++) {
      const x = l.fretX[n];
      const xa = l.fretX[n - 1];
      const s = spreadAt(l, x);
      if (n === player.fret || (pos && pos.fret === n)) {
        const active = n === player.fret;
        ctx.fillStyle = rgba(C.accent, active ? 0.22 : 0.08);
        ctx.fillRect(Math.min(xa, x), l.centerY - s - l.h * 0.03, Math.abs(x - xa), 2 * s + l.h * 0.06);
        if (pos && pos.fret === n) {
          ctx.strokeStyle = rgba(C.accent, 0.9);
          ctx.lineWidth = 1.5;
          ctx.strokeRect(Math.min(xa, x) + 1, l.centerY - s - l.h * 0.03 + 1, Math.abs(x - xa) - 2, 2 * s + l.h * 0.06 - 2);
        }
      }
      ctx.strokeStyle = rgba(C.ink, 0.28);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, l.centerY - s - l.h * 0.03);
      ctx.lineTo(x, l.centerY + s + l.h * 0.03);
      ctx.stroke();
      // Inlay dots + fret numbers.
      const mid = (x + xa) / 2;
      if ([3, 5, 7, 9].includes(n)) this.dot(mid, l.centerY, 4, rgba(C.ink, 0.18));
      if (n === 12) {
        this.dot(mid, l.centerY - s * 0.5, 4, rgba(C.ink, 0.18));
        this.dot(mid, l.centerY + s * 0.5, 4, rgba(C.ink, 0.18));
      }
      ctx.font = `500 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(C.ink, n === player.fret ? 0.95 : 0.4);
      ctx.fillText(String(n), mid, l.centerY + s + l.h * 0.03 + 16);
    }
    // Open-string target lives at the nut.
    if (pos && pos.fret === 0) {
      ctx.strokeStyle = rgba(C.accent, 0.9);
      ctx.lineWidth = 2;
      const s = spreadAt(l, l.nutX);
      ctx.beginPath();
      ctx.moveTo(l.nutX, l.centerY - s - l.h * 0.04);
      ctx.lineTo(l.nutX, l.centerY + s + l.h * 0.04);
      ctx.stroke();
    }
  }

  private drawChordSlots(player: Player, targetChord?: string): void {
    const { ctx } = this;
    const l = player.layout;
    const slots = chordSlots(l, player.chords.length);
    const { rows } = chordGrid(player.chords.length);
    for (const s of slots) {
      const name = player.chords[s.index];
      const active = s.index === player.slot;
      const isTarget = targetChord === name;
      if (active) {
        ctx.fillStyle = rgba(C.accent, player.muted ? 0.06 : 0.16);
        ctx.fillRect(s.x0 + 2, s.y0 + 2, s.x1 - s.x0 - 4, s.y1 - s.y0 - 4);
      }
      if (isTarget) {
        ctx.strokeStyle = rgba(C.accent, 0.95);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(s.x0 + 2.5, s.y0 + 2.5, s.x1 - s.x0 - 5, s.y1 - s.y0 - 5);
      }
      // Slot divider.
      ctx.strokeStyle = rgba(C.ink, 0.16);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y0);
      ctx.lineTo(s.x1, s.y1);
      ctx.stroke();
      // Label above (row 0) or below (row 1) the strings so it never hides them.
      const below = rows === 2 && s.y0 >= l.centerY - 1;
      const ly = below ? s.y1 + 24 : s.y0 - 12;
      ctx.font = `${active ? 600 : 500} ${active ? 20 : 17}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = isTarget ? rgba(C.accent, 1) : rgba(C.ink, active ? 0.95 : 0.55);
      ctx.fillText(name, (s.x0 + s.x1) / 2, ly);
      ctx.font = `500 10px ${FONT}`;
      ctx.fillStyle = rgba(C.ink, 0.3);
      ctx.fillText(String(s.index + 1), (s.x0 + s.x1) / 2, below ? ly + 15 : ly - 20);
    }
    if (rows === 2) {
      ctx.strokeStyle = rgba(C.ink, 0.1);
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(slots[0].x0, l.centerY);
      ctx.lineTo(l.neckEndX, l.centerY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  private drawStrings(player: Player, target: { chord?: string; midi?: number } | null): void {
    const { ctx } = this;
    const l = player.layout;
    const n = l.strings;
    const tuning = player.instrument.tuning;
    const notes = player.mode === 'chord' && player.chord ? chordNotes(player.chord, tuning) : null;
    const targetPos = target?.midi !== undefined ? findPosition(target.midi, tuning, l.maxFret) : null;
    const ys = strumStringYs(l);
    const xEnd = l.strumX1;
    const xStart = l.nutX;
    const steps = 48;
    for (let i = 0; i < n; i++) {
      const e = player.energy[i] ?? 0;
      const silent = notes ? notes[i] === null : false;
      const thick = (n === 4 ? 3.2 : 2.6) - (i * (n === 4 ? 0.55 : 0.36));
      const isTarget = targetPos?.string === i;
      ctx.strokeStyle = isTarget
        ? rgba(C.accent, 0.95)
        : rgba(C.ink, silent ? 0.18 : 0.55 + 0.4 * Math.min(1, e));
      ctx.lineWidth = Math.max(0.8, thick);
      ctx.beginPath();
      for (let k = 0; k <= steps; k++) {
        const u = k / steps;
        const x = xStart + (xEnd - xStart) * u;
        // stringY clamps past the neck, so strings run straight across the body.
        const y = stringY(l, i, x) + Math.sin(Math.PI * u) * Math.sin(this.phase * 70 + i * 1.7) * e * 5;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Note name at the bridge end in note mode, string number otherwise.
      ctx.font = `500 11px ${FONT}`;
      ctx.textAlign = l.lefty ? 'right' : 'left';
      ctx.fillStyle = rgba(C.ink, silent ? 0.2 : 0.5);
      const label =
        player.mode === 'note'
          ? pitchClass(tuning[i] + player.fret)
          : notes && notes[i] === null
            ? '×'
            : notes
              ? pitchClass(notes[i]!)
              : pitchClass(tuning[i]);
      ctx.fillText(label, xEnd + (l.lefty ? -16 : 16), ys[i] + 4);
    }
  }

  private drawHands(player: Player): void {
    const { ctx } = this;
    for (const hand of [player.fretHand, player.strumHand]) {
      if (!hand) continue;
      for (const idx of [4, 8, 12, 16, 20]) this.dot(hand[idx].x, hand[idx].y, 2.5, rgba(C.ink, 0.35));
    }
    if (player.fretPoint) {
      const p = player.fretPoint;
      ctx.strokeStyle = rgba(C.accent, player.muted ? 0.4 : 0.95);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Pick trail.
    const now = performance.now() / 1000;
    const tr = player.trail;
    for (let i = 1; i < tr.length; i++) {
      const a = Math.max(0, 1 - (now - tr[i].t) / 0.25);
      ctx.strokeStyle = rgba(C.ink, 0.5 * a);
      ctx.lineWidth = 3 * a + 0.5;
      ctx.beginPath();
      ctx.moveTo(tr[i - 1].p.x, tr[i - 1].p.y);
      ctx.lineTo(tr[i].p.x, tr[i].p.y);
      ctx.stroke();
    }
    if (player.strumPoint) {
      this.dot(player.strumPoint.x, player.strumPoint.y, 7, rgba(C.ink, 0.95));
    }
  }

  private drawDiagram(chord: string, muted: boolean, l: Layout): void {
    const { ctx } = this;
    if (!chord) return;
    const frets = chordNotes(chord, [40, 45, 50, 55, 59, 64]).map((m, i) =>
      m === null ? null : m - [40, 45, 50, 55, 59, 64][i],
    );
    const played = frets.filter((f): f is number => f !== null && f > 0);
    const minF = played.length ? Math.min(...played) : 1;
    const base = Math.max(...played, 0) > 4 ? minF : 1;
    const w = 92;
    const h = 108;
    const x0 = l.lefty ? l.w - w - 36 : 36;
    const y0 = l.h - h - 40;
    const sx = w / 5;
    const sy = h / 5;
    ctx.save();
    ctx.globalAlpha = muted ? 0.35 : 1;
    ctx.font = `600 15px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = rgba(C.ink, 0.9);
    ctx.fillText(chord, x0, y0 - 24);
    ctx.strokeStyle = rgba(C.ink, 0.35);
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(x0 + i * sx, y0);
      ctx.lineTo(x0 + i * sx, y0 + h);
      ctx.stroke();
    }
    for (let j = 0; j <= 5; j++) {
      ctx.lineWidth = j === 0 && base === 1 ? 3 : 1;
      ctx.beginPath();
      ctx.moveTo(x0, y0 + j * sy);
      ctx.lineTo(x0 + w, y0 + j * sy);
      ctx.stroke();
    }
    if (base > 1) {
      ctx.font = `500 11px ${FONT}`;
      ctx.fillStyle = rgba(C.ink, 0.5);
      ctx.fillText(`${base}fr`, x0 + w + 8, y0 + sy * 0.65);
    }
    frets.forEach((f, i) => {
      const x = x0 + i * sx;
      ctx.font = `500 11px ${FONT}`;
      ctx.textAlign = 'center';
      if (f === null) {
        ctx.fillStyle = rgba(C.ink, 0.45);
        ctx.fillText('×', x, y0 - 6);
      } else if (f === 0) {
        ctx.strokeStyle = rgba(C.ink, 0.6);
        ctx.beginPath();
        ctx.arc(x, y0 - 10, 3.5, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        this.dot(x, y0 + (f - base + 0.5) * sy, 6, rgba(C.accent, 0.95));
      }
    });
    ctx.restore();
  }

  private drawHighway(lesson: Lesson, player: Player, audioNow: number, now: number): void {
    const { ctx } = this;
    const l = player.layout;
    const beat = lesson.beatAt(audioNow);
    const top = 84;
    const hh = 64;
    const headX = l.w * 0.16;
    const ppb = Math.max(46, Math.min(110, l.w * 0.075));
    const xOf = (b: number) => headX + (b - beat) * ppb;

    ctx.save();
    ctx.fillStyle = rgba(C.shade, 0.55);
    ctx.fillRect(0, top, l.w, hh);
    ctx.strokeStyle = rgba(C.ink, 0.08);
    ctx.beginPath();
    ctx.moveTo(0, top + 0.5);
    ctx.lineTo(l.w, top + 0.5);
    ctx.moveTo(0, top + hh - 0.5);
    ctx.lineTo(l.w, top + hh - 0.5);
    ctx.stroke();

    // Bar lines.
    const bpb = lesson.song.beatsPerBar;
    for (let b = Math.floor(beat / bpb) * bpb; xOf(b) < l.w; b += bpb) {
      if (b < 0) continue;
      ctx.strokeStyle = rgba(C.ink, 0.12);
      ctx.beginPath();
      ctx.moveTo(xOf(b), top + 6);
      ctx.lineTo(xOf(b), top + hh - 6);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.rect(0, top, l.w, hh);
    ctx.clip();

    if (lesson.song.mode === 'chord') {
      for (const s of lesson.segments) {
        const xa = xOf(s.beat);
        const xb = xOf(s.beat + s.dur);
        if (xb < 0 || xa > l.w) continue;
        const current = beat >= s.beat && beat < s.beat + s.dur;
        ctx.fillStyle = rgba(current ? C.accent : C.ink, current ? 0.1 : 0.04);
        ctx.fillRect(xa + 1, top + 8, xb - xa - 2, 22);
        ctx.font = `600 14px ${FONT}`;
        ctx.textAlign = 'left';
        ctx.fillStyle = current ? rgba(C.accent, 1) : rgba(C.ink, 0.85);
        ctx.fillText(s.chord, Math.max(xa + 8, Math.min(headX + 8, xb - 40)), top + 24);
      }
    }

    for (const tg of lesson.targets) {
      const x = xOf(tg.beat);
      if (x < -60 || x > l.w + 20) continue;
      const col = tg.result === 'miss' ? rgba(C.miss, 0.8) : tg.result ? rgba(C.accent, tg.result === 'perfect' ? 1 : 0.6) : rgba(C.ink, 0.85);
      if (tg.strum) {
        // Down/up arrow.
        const y = top + 46;
        const d = tg.strum === 'D' ? 1 : -1;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y - 8 * d);
        ctx.lineTo(x, y + 8 * d);
        ctx.moveTo(x - 4, y + 4 * d);
        ctx.lineTo(x, y + 8 * d);
        ctx.lineTo(x + 4, y + 4 * d);
        ctx.stroke();
      } else if (tg.midi !== undefined) {
        const w = Math.max(10, tg.dur * ppb - 4);
        ctx.fillStyle = tg.result ? col.replace(/[\d.]+\)$/, '0.18)') : rgba(C.ink, 0.06);
        ctx.fillRect(x, top + 10, w, hh - 20);
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, top + 10.5, w - 1, hh - 21);
        const pos = findPosition(tg.midi, player.instrument.tuning, player.layout.maxFret);
        ctx.font = `600 13px ${FONT}`;
        ctx.textAlign = 'left';
        ctx.fillStyle = col;
        ctx.fillText(midiToName(tg.midi), x + 7, top + 30);
        if (pos) {
          ctx.font = `500 10px ${FONT}`;
          ctx.fillStyle = rgba(C.ink, 0.55);
          const stringNo = player.instrument.tuning.length - pos.string;
          ctx.fillText(`${stringNo}.${t('ui.string')} · ${pos.fret === 0 ? t('ui.open') : pos.fret}`, x + 7, top + 45);
        }
      }
    }
    ctx.restore();

    // Playhead.
    ctx.strokeStyle = rgba(C.accent, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(headX, top - 4);
    ctx.lineTo(headX, top + hh + 4);
    ctx.stroke();

    // Count-in.
    if (beat < 0 && lesson.started) {
      const n = Math.ceil(-beat);
      ctx.font = `300 96px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(C.ink, 0.9);
      ctx.fillText(String(n), l.w / 2, l.h * 0.38);
    }

    if (lesson.isWaiting) {
      ctx.font = `500 14px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillStyle = rgba(C.accent, 0.5 + 0.4 * Math.sin(now * 5));
      const nt = lesson.nextTarget;
      const what = nt?.chord ?? (nt?.midi !== undefined ? midiToName(nt.midi) : '');
      ctx.fillText(`${t('lesson.waitHint')}: ${what}`, headX + 14, top + hh + 22);
    }

    // Judgement popups rise from the playhead.
    const recent = lesson.judgements.filter((j) => now * 1000 - j.at < 700);
    for (const j of recent.slice(-3)) {
      const age = (now * 1000 - j.at) / 700;
      ctx.font = `600 13px ${FONT}`;
      ctx.textAlign = 'center';
      const col = j.grade === 'miss' || j.grade === 'wrong' ? C.miss : C.accent;
      ctx.fillStyle = rgba(col, 1 - age);
      ctx.fillText(t(`grade.${j.grade}`), headX, top + hh + 44 - age * 14);
    }
  }

  private dot(x: number, y: number, r: number, fill: string): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = fill;
    this.ctx.fill();
  }
}

export function landmarkToScreen(p: Point, video: HTMLVideoElement, w: number, h: number): Point {
  const vw = video.videoWidth || 1280;
  const vh = video.videoHeight || 720;
  const scale = Math.max(w / vw, h / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  return { x: (w - dw) / 2 + p.x * dw, y: (h - dh) / 2 + p.y * dh };
}
