# Roadmap

Decided-in-principle ideas and the reasoning behind them. Not a task tracker: when an item is
ready, open a GitHub issue and link it here.

| Status | Meaning |
|---|---|
| `idea` | Wanted; approach not settled |
| `shaped` | Approach settled, ready to issue |
| `shipped` | Live; the entry keeps only what is still open |

## Open work (as of v0.2.2, 2026-11-04)

| Item | Where |
|---|---|
| Connect Vercel to GitHub for automatic deploys (prod is deployed by hand until then) | #6, [`deploy.md`](deploy.md) |
| Calibrate drum sounds against real recordings (SM Drums / Big Rusty Drums) | #13 |
| Inharmonicity: replace the single dispersion allpass; calibrate acoustic and nylon | #14 |
| Manual QA pass with a real camera on production | #15 |

## Professional parity — the bar every instrument must clear

An instrument ships only when it can do what the real one does, proven by a real song:

1. **Full range**: every string and every fret of the professional instrument (classical 19, steel-string 20,
   electric 22, bass 24), with its standard and common alternate tunings.
2. **Full voicing**: several strings at once (bass + inner voices + melody); notes ring on as a player lets them.
3. **Real voice**: recorded samples per string and fret, dynamic layers, synth only as a fallback.
4. **Techniques**: the instrument's own (bends, slides, hammer-ons, harmonics, palm mute, tremolo, …).
5. **Real-song test**: a complete public-domain piece at its real tempo (never a slowed practice version),
   compared note by note with the score in CI (`real-song-performance.test.ts`) and, when a public-domain
   recording exists, aligned against it (`npm run test:songs`: same music, same speed within 5 %).
6. **Real-instrument test**: every note it plays is held against a recording of the real instrument
   (`instruments-vs-real.audio.test.ts`): within 3 cents of true pitch, and the synth fallback no further from
   the recordings in decay and tone than the last measurement (ratchet; today 2–6× too short a decay).

### Where the current instruments stand (2026-11-04)

| Instrument | Range | Real song (tests) | Open gaps |
|---|---|---|---|
| Acoustic (steel) | 20 frets ✓ | Bach Prélude, Claro de Luna ✓ | Licence of the samples unverified; one dynamic layer |
| Classical (nylon) | 19 frets ✓ | Claro de Luna (drop D), Bach Prélude ✓ | Same |
| Clean electric | 22 frets ✓ | Both ✓ | Only 13 samples, re-pitched ±2 semitones: needs per-string/per-fret recordings |
| Drive electric | 22 frets ✓ | Bach Prélude ✓ | Same as clean |
| Bass | 24 frets ✓ | Bach Prélude at cello pitch ✓, Casals ✓ | Samples cover only E1–A2: 550 of 656 notes are synthesised; needs a full-range set; 5-string option |
| Drums | — | — | Groove charts and a real-song test (see Drum lessons) |

The on-screen neck still shows 12 frets: the guide plays the whole neck, but an air player can't reach fret 13+
yet. See *Neck position shift* below.

## Neck position shift — `shaped`
The visible neck is a 12-fret window. Let it slide (as a hand moves up the neck) so free and note mode reach
every fret the instrument has; lessons move it to the position the fingering plan uses.

## Future instruments — `idea`
Each needs its own string/key model (or samples), a drawing, a gesture mapping and a real public-domain
song test before it ships. Grouped by how much of the existing code they reuse.

**Fretted, same hand model (tuning + frets + samples)**
- 12-string guitar (octave courses), 7- and 8-string guitar, baritone guitar
- 5- and 6-string bass, fretless bass (continuous pitch), acoustic bass guitar
- Ukulele (soprano, concert, tenor, baritone), guitalele
- Mandolin and mandola (paired courses, tremolo picking), Irish bouzouki
- Banjo (5-string with the short drone string; 4-string tenor), resonator guitar / dobro
- Bağlama / saz (kısa and uzun sap, microtonal frets — 17+ per octave), cura, tanbur, cümbüş
- Oud and fretless lutes (continuous pitch, maqam intonation), Renaissance lute, balalaika, sitar (sympathetic strings)
- Lap steel and pedal steel (slide bar instead of frets)

**Plucked or struck without a fretting hand**
- Harp (concert, Celtic), kanun (with mandal pitch levers), santur / hammered dulcimer, kalimba

**Bowed (needs a bow gesture: hand speed → loudness, continuous pitch)**
- Violin, viola, cello, double bass, kemençe, erhu

**Keyboards (finger-per-key tracking)**
- Piano (88 keys, sustain pedal via the pedal inputs), electric piano, organ, accordion, synthesizer

**Percussion (reuse the drum kit's stick and pad code)**
- Darbuka, def / bendir, cajón, congas and bongos, tabla, djembe, handpan, timpani
- Mallets: marimba, xylophone, vibraphone, glockenspiel

**Air-only**
- Theremin (pitch from one hand's height, volume from the other) — the most natural webcam instrument

## Instrument voices — ranked versions of each instrument — `shaped`
Keep several voices per instrument — e.g. recorded set A, recorded set B, the synth fitted to recordings, the
original hand-tuned synth — and score all of them with the same real-instrument test
(`instruments-vs-real.audio.test.ts`: pitch, decay, tone colour; plus the real-song tests). The best score is the
default; the others stay selectable in settings as the second and third option, so a player can pick by ear and
the ranking shows what to improve next.

## Hands-only view — `idea`
A button that hides the camera picture: the stage shows only the instrument and the tracked hands as their
skeleton (the landmark points and the lines between them), with the existing strum and fret highlights. Cleaner
to look at, nothing personal on screen (good for recording or streaming), and still shows exactly what the app
sees. Tracking keeps running; only the video layer is hidden. Persisted like the other display settings.

## Play-along — karaoke for instruments — `idea`
Karaoke, but you play instead of sing: pick a song, the band (backing track or recording) plays every other
part, and your instrument's part scrolls by in time — chords, notes or drum hits — scored as you go. Your part
is muted in the mix so you fill the gap; a "guide" level brings it back while learning. Builds on the lesson
timeline, the shadow guide and the real-song tests (tempo and alignment against a recording). Songs: public
domain or the player's own files; backing tracks for copyrighted songs need licensing.

## Mac app — `idea`
Wrap the web build with Tauri for a dock icon, offline use and no browser chrome. The camera
permission prompt moves to macOS; the WASM model and worklet already load from local files.

## Solid-body shapes — `idea`
Electric and bass bodies reuse the acoustic profile; give them double cutaways (horns) so they read as electrics at a glance.

## Pressing vs hovering — `idea`
In free mode a fingertip over the neck counts as pressing. Use landmark depth (tip z relative to the knuckle)
to tell a lifted finger from a pressing one; needs per-camera calibration.

## Drum lessons — `idea`
Groove charts (rock, shuffle, half-time) with the same coach, wait mode and shadow guide as the guitar lessons.

## Calibration — `idea`
Measure camera + audio latency with a tap-along test instead of a slider, and let the player drag
the instrument's position and size to fit how they sit.

## Depth-aware strumming — `idea`
Use the landmark z (or hand scale) to tell a strum from the hand returning, instead of the
down-only filter. Needs real-world data from several cameras.

## More songs and an editor — `idea`
Only traditional / public-domain tunes ship. A small editor for the text notation would let
players add their own charts.

## Velocity layers — `shaped`
The sample sets have three dynamic layers; the engine loads one (memory). Stream layers on demand so a soft
stroke and a hard one sound different, not just quieter.

## Fingerstyle and riffs — `idea`
Single-string picking with several fingers (one per string) for arpeggios like *House of the Rising Sun*.
