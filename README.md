# Airfret

**Play guitar and bass in the air.** Your webcam sees both hands; a virtual instrument sits over
the mirrored image; every note is synthesised in real time. Lessons teach songs with a scrolling
timeline, a wait-for-me mode and timing scores.

- **Five instruments** — acoustic, nylon, clean electric, overdrive, 4-string bass.
- **Chord mode** — point the left index finger at a chord box, strum with the right. Faster = louder.
  A fist on the neck mutes for a percussive chuck.
- **Note mode** — the left hand holds a fret (1–12), the right hand plucks single strings.
- **Lessons** — 11 traditional / public-domain tunes and exercises; count-in, metronome or drums,
  60–100 % tempo, *wait for me* or *play along*; best scores saved; a real-guitar chord diagram for
  every chord, so practice carries over to a real instrument.
- **Private by design** — hand tracking runs in the browser; video never leaves the device.
- **No camera?** Drag the mouse across the strings; number keys pick chords or frets.

## Getting started

```bash
npm install
npm run dev       # http://localhost:5180 — use Chrome or Safari, allow the camera
```

Sit about an arm's length from the camera with even light on your hands.

## Checking your work

```bash
npm run check     # lint · typecheck · tests with per-layer coverage minimums · structure gate
npm run build     # static site in dist/
```

The pre-commit hook runs the same gates plus a secret scan. Camera, rendering and sound are
covered by the manual pass in [`docs/qa/manual.md`](docs/qa/manual.md).

## How it is built

Vite + strict TypeScript, no UI framework, Clean Architecture / DDD layers
(`core → domain → application / infrastructure → presentation`). Start with
[`CLAUDE.md`](CLAUDE.md) for the rules and [`architecture.md`](architecture.md) for the why;
[`PROJECT-MAP.md`](PROJECT-MAP.md) indexes every file.

- **Hand tracking:** MediaPipe Hand Landmarker (WASM + WebGL), One-Euro smoothing.
- **Strumming:** per-string crossing detection with hysteresis and sub-frame timing.
- **Sound:** an extended Karplus–Strong string bank in an AudioWorklet, tuned to within 2 cents,
  through per-instrument body / amp / cabinet chains.

## Shipping

`dev` is the working branch (Vercel preview); `main` is production. Feature branches → PR to
`dev` → release PR `dev → main`. See [`.claude/skills/`](.claude/skills).

## Docs

[Roadmap](docs/roadmap.md) · [Regressions](docs/regressions.md) · [Privacy & security](docs/privacy.md) · [Manual QA](docs/qa/manual.md)
