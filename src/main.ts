import './style.css';
import { AudioEngine } from './audio/engine';
import { INSTRUMENTS, instrumentById, type PlayMode } from './audio/instruments';
import { getLang, setLang, t, type Lang } from './i18n';
import { Lesson, type LessonOptions } from './lesson/lesson';
import { CHORD_SETS, SONGS, type Song } from './lesson/songs';
import { knownChord } from './music/theory';
import { computeLayout } from './play/layout';
import { Player } from './play/player';
import { landmarkToScreen, Renderer } from './render';
import { HandTracker } from './tracking';

// ---------- persisted settings ----------

interface Settings {
  instrument: string;
  mode: PlayMode;
  chordSet: string;
  lefty: boolean;
  volume: number;
  brightness: number;
  latencyMs: number;
  lesson: { tempo: number; wait: boolean; easy: boolean; drums: boolean };
  best: Record<string, number>;
}

const DEFAULTS: Settings = {
  instrument: 'acoustic',
  mode: 'chord',
  chordSet: 'pop',
  lefty: false,
  volume: 0.8,
  brightness: 0.55,
  latencyMs: 70,
  lesson: { tempo: 0.8, wait: true, easy: true, drums: false },
  best: {},
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem('airfret.settings');
    if (raw) {
      const s = JSON.parse(raw);
      return { ...DEFAULTS, ...s, lesson: { ...DEFAULTS.lesson, ...s.lesson }, best: { ...s.best } };
    }
  } catch {
    /* storage unavailable or corrupt */
  }
  return structuredClone(DEFAULTS);
}

const settings = loadSettings();
function save(): void {
  try {
    localStorage.setItem('airfret.settings', JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

// ---------- DOM ----------

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const video = $<HTMLVideoElement>('cam');
const canvas = $<HTMLCanvasElement>('stage');

const engine = new AudioEngine();
const tracker = new HandTracker(video);
const player = new Player(engine);
const renderer = new Renderer(canvas);

let lesson: Lesson | null = null;
let selectedSong: Song = SONGS[0];
let cameraOk = false;
let started = false;
let lastHandsAt = 0;
let pointerDown = false;

function translate(): void {
  document.documentElement.lang = getLang();
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n!);
  });
  buildControls();
  buildSongList();
}

function seg<T extends string | number | boolean>(
  host: HTMLElement,
  items: { value: T; label: string }[],
  current: T,
  onPick: (v: T) => void,
): void {
  host.replaceChildren(
    ...items.map((it) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(it.value === current));
      b.textContent = it.label;
      b.onclick = () => {
        onPick(it.value);
        host.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      };
      return b;
    }),
  );
}

function buildControls(): void {
  seg(
    $('instruments'),
    INSTRUMENTS.map((i) => ({ value: i.id, label: t(i.name) })),
    settings.instrument,
    (id) => {
      settings.instrument = id;
      // Switching to/from bass changes the natural play mode.
      if (!lesson) settings.mode = instrumentById(id).defaultMode;
      if (id === 'drive' && settings.chordSet === 'pop' && !lesson) settings.chordSet = 'rock';
      save();
      applyInstrument();
      buildControls();
    },
  );
  seg(
    $('modes'),
    (['chord', 'note'] as PlayMode[]).map((m) => ({ value: m, label: t(`mode.${m}`) })),
    settings.mode,
    (m) => {
      settings.mode = m;
      save();
      applyInstrument();
      buildControls();
    },
  );
  const sel = $<HTMLSelectElement>('chordSet');
  sel.replaceChildren(
    ...CHORD_SETS.map((c) => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.name;
      o.selected = c.id === settings.chordSet;
      return o;
    }),
  );
  sel.disabled = settings.mode !== 'chord' || !!lesson;
  sel.hidden = settings.mode !== 'chord';
  $('modes').querySelectorAll('button').forEach((b) => ((b as HTMLButtonElement).disabled = !!lesson));

  seg(
    $('langs'),
    [
      { value: 'tr' as Lang, label: 'Türkçe' },
      { value: 'en' as Lang, label: 'English' },
    ],
    getLang(),
    (l) => {
      setLang(l);
      translate();
    },
  );
  const o = settings.lesson;
  seg($('optTempo'), [0.6, 0.8, 1].map((v) => ({ value: v, label: `${Math.round(v * 100)}%` })), o.tempo, (v) => {
    o.tempo = v;
    save();
  });
  seg(
    $('optWait'),
    [
      { value: true, label: t('lesson.wait') },
      { value: false, label: t('lesson.play') },
    ],
    o.wait,
    (v) => {
      o.wait = v;
      save();
    },
  );
  seg(
    $('optEasy'),
    [
      { value: true, label: t('lesson.easy') },
      { value: false, label: t('lesson.full') },
    ],
    o.easy,
    (v) => {
      o.easy = v;
      save();
    },
  );
}

function chordsForPlay(): string[] {
  if (lesson && lesson.song.mode === 'chord') return lesson.chordSet;
  const set = CHORD_SETS.find((c) => c.id === settings.chordSet) ?? CHORD_SETS[0];
  return set.chords.filter(knownChord);
}

function applyInstrument(): void {
  const inst = instrumentById(settings.instrument);
  engine.setInstrument(inst);
  relayout();
}

function relayout(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const inst = instrumentById(settings.instrument);
  renderer.resize(w, h);
  player.configure(computeLayout(w, h, inst.tuning.length, settings.lefty, inst.maxFret), inst, settings.mode, chordsForPlay());
}

// ---------- settings popover ----------

function wireSettings(): void {
  const lefty = $<HTMLInputElement>('lefty');
  const vol = $<HTMLInputElement>('volume');
  const bri = $<HTMLInputElement>('brightness');
  const lat = $<HTMLInputElement>('latency');
  lefty.checked = settings.lefty;
  vol.value = String(settings.volume);
  bri.value = String(settings.brightness);
  lat.value = String(settings.latencyMs);
  const showLat = () => ($('latencyVal').textContent = `${settings.latencyMs} ms`);
  showLat();
  document.documentElement.style.setProperty('--cam', String(settings.brightness));

  lefty.onchange = () => {
    settings.lefty = lefty.checked;
    save();
    relayout();
  };
  vol.oninput = () => {
    settings.volume = Number(vol.value);
    engine.setVolume(settings.volume);
    save();
  };
  bri.oninput = () => {
    settings.brightness = Number(bri.value);
    document.documentElement.style.setProperty('--cam', bri.value);
    save();
  };
  lat.oninput = () => {
    settings.latencyMs = Number(lat.value);
    showLat();
    save();
  };
  $<HTMLSelectElement>('chordSet').onchange = (e) => {
    settings.chordSet = (e.target as HTMLSelectElement).value;
    save();
    relayout();
  };

  const toggle = (id: string, others: string[]) => () => {
    const el = $(id);
    el.hidden = !el.hidden;
    others.forEach((o) => ($(o).hidden = true));
  };
  $('settingsBtn').onclick = toggle('settings', ['help']);
  $('helpBtn').onclick = toggle('help', ['settings']);
  canvas.addEventListener('pointerdown', () => {
    $('settings').hidden = true;
    $('help').hidden = true;
  });
}

// ---------- lessons ----------

function buildSongList(): void {
  const list = $('songList');
  list.replaceChildren();
  const groups: [string, Song[]][] = [
    [t('lesson.chordMode'), SONGS.filter((s) => s.mode === 'chord')],
    [t('lesson.noteMode'), SONGS.filter((s) => s.mode === 'note')],
  ];
  for (const [label, songs] of groups) {
    const g = document.createElement('div');
    g.className = 'group-label';
    g.textContent = label;
    list.append(g);
    for (const s of songs) {
      const el = document.createElement('div');
      el.className = 'song';
      el.setAttribute('role', 'option');
      el.setAttribute('aria-selected', String(s === selectedSong));
      el.tabIndex = 0;
      const best = settings.best[s.id];
      el.innerHTML = `
        <div class="name"></div>
        <div class="meta"><span class="dots">${'●'.repeat(s.level)}<span class="off">${'●'.repeat(3 - s.level)}</span></span></div>
        <div class="about"></div>
        <div class="meta" style="grid-column:1/-1;text-align:left"></div>`;
      el.querySelector('.name')!.textContent = s.title;
      el.querySelector('.about')!.textContent = t(s.about);
      const meta = el.querySelectorAll('.meta')[1] as HTMLElement;
      meta.textContent = `${t(s.credit)} · ${s.bpm} BPM · ${t(instrumentById(s.instrument).name)}`;
      if (best !== undefined) {
        const b = document.createElement('span');
        b.className = 'best';
        b.textContent = ` · ${t('lesson.best')} ${Math.round(best * 100)}%`;
        meta.append(b);
      }
      const pick = () => {
        selectedSong = s;
        buildSongList();
        $('optEasyRow').hidden = s.mode !== 'chord';
      };
      el.onclick = pick;
      el.ondblclick = () => startLesson(s);
      el.onkeydown = (e) => {
        if (e.key === 'Enter') startLesson(s);
      };
      list.append(el);
    }
  }
  $('optEasyRow').hidden = selectedSong.mode !== 'chord';
}

function startLesson(song: Song): void {
  $('lessons').hidden = true;
  $('result').hidden = true;
  const o = settings.lesson;
  const opts: LessonOptions = {
    tempo: o.tempo,
    wait: o.wait,
    easy: o.easy,
    drums: o.drums,
    latency: settings.latencyMs / 1000,
  };
  selectedSong = song;
  lesson = new Lesson(song, opts);
  settings.instrument = song.instrument;
  settings.mode = song.mode;
  save();
  applyInstrument();
  buildControls();
  $('lessonTitle').textContent = song.title;
  $('lessonBar').hidden = false;
  lesson.start(engine.now);
}

function stopLesson(): void {
  lesson = null;
  $('lessonBar').hidden = true;
  relayout();
  buildControls();
}

function finishLesson(l: Lesson): void {
  const acc = l.accuracy;
  const prev = settings.best[l.song.id] ?? 0;
  if (acc > prev) settings.best[l.song.id] = acc;
  save();
  $('resultTitle').textContent = l.song.title;
  $('resultAcc').textContent = `${Math.round(acc * 100)}%`;
  $('resultCounts').textContent = t('lesson.counts', { p: l.counts.perfect, g: l.counts.good, m: l.counts.miss });
  $('resultStreak').textContent = `${t('lesson.streak')}: ${l.bestStreak}`;
  $('result').hidden = false;
  stopLesson();
  buildSongList();
}

function scheduleBeat(l: Lesson, beat: number, when: number): void {
  const bpb = l.song.beatsPerBar;
  const whole = Math.abs(beat - Math.round(beat)) < 1e-6;
  const inBar = ((Math.round(beat * 2) / 2) % bpb + bpb) % bpb;
  if (beat < 0 || !l.opts.drums) {
    if (whole) engine.click(when, inBar === 0);
    return;
  }
  // Simple groove: kick on 1 (and 3 in 4/4), snare on the backbeat, hats on eighths.
  engine.drum('hat', when, whole ? 0.9 : 0.55);
  if (!whole) return;
  if (bpb === 4) {
    if (inBar === 0 || inBar === 2) engine.drum('kick', when);
    else engine.drum('snare', when);
  } else if (bpb === 3) {
    if (inBar === 0) engine.drum('kick', when);
    else engine.drum('snare', when, 0.5);
  } else if (bpb === 6) {
    if (inBar === 0) engine.drum('kick', when);
    if (inBar === 3) engine.drum('snare', when);
  }
}

function wireLessons(): void {
  $('lessonsBtn').onclick = () => {
    buildSongList();
    $('lessons').hidden = false;
    $('settings').hidden = true;
    $('help').hidden = true;
  };
  $('lessonsClose').onclick = () => ($('lessons').hidden = true);
  $('lessonStart').onclick = () => startLesson(selectedSong);
  $('lessonStop').onclick = stopLesson;
  $('resultAgain').onclick = () => startLesson(selectedSong);
  $('resultBack').onclick = () => {
    $('result').hidden = true;
    $('lessons').hidden = false;
  };
  const drums = $<HTMLInputElement>('optDrums');
  drums.checked = settings.lesson.drums;
  drums.onchange = () => {
    settings.lesson.drums = drums.checked;
    save();
  };
}

player.onEvent = (e) => {
  if (!lesson) return;
  lesson.input(e.when, e.chord !== undefined ? { chord: e.chord } : { midi: e.midi });
};

// ---------- input fallbacks ----------

function wirePointer(): void {
  const pos = (e: PointerEvent) => ({ x: e.clientX, y: e.clientY });
  canvas.addEventListener('pointerdown', (e) => {
    pointerDown = true;
    canvas.setPointerCapture(e.pointerId);
    player.pointer(pos(e), performance.now() / 1000, engine.now);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (pointerDown) player.pointer(pos(e), performance.now() / 1000, engine.now);
  });
  const up = () => {
    pointerDown = false;
    player.pointer(null, performance.now() / 1000, engine.now);
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    if (/^[0-9]$/.test(e.key)) {
      const n = Number(e.key);
      player.selectSlot(player.mode === 'chord' ? (n === 0 ? 9 : n - 1) : n);
    } else if (e.key === 'Escape') {
      $('lessons').hidden = true;
      $('settings').hidden = true;
      $('help').hidden = true;
    }
  });
}

// ---------- main loop ----------

function frame(): void {
  const nowMs = performance.now();
  const now = nowMs / 1000;
  const audioNow = engine.now;

  if (cameraOk) {
    const hands = tracker.detect(nowMs);
    if (hands) {
      if (hands.length) lastHandsAt = now;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const px = hands.map((hd) => hd.landmarks.map((p) => landmarkToScreen(p, video, w, h)));
      // The mouse wins while dragging, so testing works with hands in view too.
      player.updateHands(px, now, audioNow, !pointerDown);
    }
  }

  if (lesson) {
    const l = lesson;
    l.update(audioNow, (b, when) => scheduleBeat(l, b, when));
    $('lessonProgress').style.width = `${l.progress(audioNow) * 100}%`;
    $('lessonAcc').textContent = `${Math.round(l.accuracy * 100)}%`;
    $('lessonStreak').textContent = String(l.streak);
    if (l.done) finishLesson(l);
  }

  let hint: string | null = null;
  if (started && !cameraOk) hint = t('app.mouseHint');
  else if (started && now - lastHandsAt > 2.5) hint = t('app.noHands');
  renderer.draw(player, lesson, audioNow, now, hint);
  requestAnimationFrame(frame);
}


// ---------- boot ----------

async function boot(): Promise<void> {
  setLang(getLang());
  translate();
  wireSettings();
  wireLessons();
  wirePointer();
  window.addEventListener('resize', relayout);

  const status = $('startStatus');
  const startBtn = $<HTMLButtonElement>('startBtn');
  startBtn.onclick = async () => {
    startBtn.disabled = true;
    try {
      void engine.resume();
      await engine.init(instrumentById(settings.instrument));
      engine.setVolume(settings.volume);
      relayout();
      started = true;
      try {
        status.textContent = t('app.camera');
        await tracker.startCamera();
        status.textContent = t('app.loadingModel');
        await tracker.loadModel();
        cameraOk = true;
      } catch (err) {
        console.warn('Camera / tracking unavailable', err);
        toast(t('app.cameraError'), 6000);
      }
      $('start').hidden = true;
      lastHandsAt = performance.now() / 1000;
    } catch (err) {
      console.error(err);
      status.textContent = String(err);
      startBtn.disabled = false;
    }
  };

  // Draw the instrument behind the start card so the first impression isn't empty.
  relayout();
  requestAnimationFrame(frame);
}


let toastTimer = 0;
function toast(msg: string, ms = 3000): void {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (el.hidden = true), ms);
}

boot();

// Dev-only handle for poking at the app from the console.
if (import.meta.env.DEV) Object.assign(window, { airfret: { player, engine, get lesson() { return lesson; } } });
