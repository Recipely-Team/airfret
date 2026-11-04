<div align="center">

# Airfret

### Play guitar, bass and drums in the air.

Your webcam watches both hands. A real-looking instrument sits over the mirrored image,<br/>
and every note comes from recordings of real instruments, in real time, in the browser.

[![Play now](https://img.shields.io/badge/play-airfret.vercel.app-e0a458?style=for-the-badge&labelColor=161514)](https://airfret.vercel.app)
&nbsp;
![TypeScript](https://img.shields.io/badge/TypeScript-strict-2b2a28?style=for-the-badge&logo=typescript&logoColor=e0a458)
![No upload](https://img.shields.io/badge/video-never%20leaves%20your%20device-2b2a28?style=for-the-badge)

</div>

<br/>

## What you can do

<table>
<tr>
<td width="33%" valign="top">

**🎸 Strum chords**<br/>
Point at a chord with one hand, strum with the other. Faster is louder; a fist on the neck gives a muted *chuck*.

</td>
<td width="33%" valign="top">

**🎼 Play anything, fret by fret**<br/>
Free mode is a real fretboard: every fingertip frets its own string — barres, bends, slides, hammer-ons.

</td>
<td width="33%" valign="top">

**🥁 Air drums**<br/>
Sticks in your hands, a full kit on screen, and pedals on any key, mouse button, gamepad or MIDI pedal.

</td>
</tr>
<tr>
<td valign="top">

**📚 Learn real songs**<br/>
26 lessons: a beginner course, traditional songs, and complete classical pieces at full tempo.

</td>
<td valign="top">

**👤 Shadow a guitarist**<br/>
A guide plays every note with you, like a teacher beside you — then step in and play along, or let it wait for you.

</td>
<td valign="top">

**🖱️ No camera? Still works**<br/>
Drag the mouse across the strings; number keys pick chords and frets.

</td>
</tr>
</table>

## Instruments

| | Instrument | Neck | Voice |
|---|---|---|---|
| 🪵 | **Acoustic** — steel string | 20 frets | Recorded, every string and fret |
| 🎻 | **Classical** — nylon | 19 frets | Recorded, every string and fret |
| ⚡ | **Clean electric** | 22 frets | Recorded |
| 🔥 | **Overdrive** | 22 frets | Recorded, through an amp model |
| 🎚️ | **Bass** — 4 strings | 24 frets | Recorded, synth above A2 |
| 🥁 | **Drums** — kit, cymbals, pedals | — | Synthesised |

Every instrument is checked against recordings of the real one: each note it plays is within **3 cents** of true pitch.
What comes next — 12-string, ukulele, bağlama, oud, violin, piano, theremin and more — is in the [roadmap](docs/roadmap.md).

## Real songs, real tempo

| Piece | On | Tempo | Proven by |
|---|---|---|---|
| **J. S. Bach** — Cello Suite No. 1, Prélude | guitars · bass (24 frets) | 70 bpm, as **Pablo Casals** plays it | aligned with his 1938 recording: same music, **0.999×** his time |
| **F. Tárrega** — *Claro de Luna* (Moonlight Sonata) | guitars, drop D | 60 bpm, as written | every note of the score, < 30 ms off |

Complete public-domain scores — bass line, inner voices and melody — never a slowed-down practice version.

## Quick start

```bash
npm install
npm run dev        # → http://localhost:5180  (Chrome or Safari, allow the camera)
```

> Sit about an arm's length from the camera, with even light on your hands.

## How it works

```
 webcam ──► MediaPipe hand landmarks ──► gestures (strum · fret · strike) ──► notes
                                                                              │
          recorded samples (one per string & fret) ◄──────────────────────────┤
          Karplus–Strong string worklet (fallback)  ◄──────────────────────────┘
                              │
                 body · amp · cabinet ──► reverb ──► limiter ──► 🔊
```

- **Hand tracking** — MediaPipe Hand Landmarker (WASM + WebGL) with One-Euro smoothing, all on-device.
- **Playing** — per-string crossing detection with sub-frame timing; strike position and finger surface shape the tone.
- **Sound** — real multisampled instruments, tuning-corrected per note; a physical string model fills the gaps.
- **Code** — Vite and strict TypeScript, no UI framework, Clean Architecture / DDD. Rules in [`CLAUDE.md`](CLAUDE.md), reasons in [`architecture.md`](architecture.md), every file in [`PROJECT-MAP.md`](PROJECT-MAP.md).

## Quality gates

| Command | Checks |
|---|---|
| `npm run check` | lint · types · tests with per-layer coverage minimums · structure rules |
| `npm run test:songs` | real songs rendered with the real samples, against the score and a real recording; every instrument against its recordings *(needs ffmpeg)* |
| `npm run build` | the static site in `dist/` |

The pre-commit hook runs the gates and a secret scan. Camera, drawing and sound feel are covered by the [manual QA pass](docs/qa/manual.md).

## Shipping

Feature branch → PR to `dev` (preview) → release PR `dev → main` (production). Skills in [`.claude/skills/`](.claude/skills).

> Vercel isn't connected to GitHub yet, so production is deployed by hand — see [`docs/deploy.md`](docs/deploy.md).

<br/>

<div align="center">

[Roadmap](docs/roadmap.md) · [Regressions](docs/regressions.md) · [Privacy & security](docs/privacy.md) · [Manual QA](docs/qa/manual.md) · [Sample credits](public/samples/CREDITS.md)

<sub>Part of <a href="https://github.com/Recipely-Team">Recipely Team</a>.</sub>

</div>
