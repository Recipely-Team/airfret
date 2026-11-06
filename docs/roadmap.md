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

### Where the current instruments stand (2026-11-05)

| Instrument | Range | Real song (tests) | Open gaps |
|---|---|---|---|
| Acoustic (steel) | 20 frets ✓ | Bach Prélude, Claro de Luna ✓ | One dynamic layer |
| Classical (nylon) | 19 frets ✓ | Claro de Luna (drop D), Bach Prélude ✓ | Same |
| Clean electric | 22 frets ✓ | Both ✓ | Only 13 samples, re-pitched ±2 semitones: needs per-string/per-fret recordings |
| Drive electric | 22 frets ✓ | Bach Prélude ✓ | Same as clean |
| Bass | 24 frets ✓ | Bach Prélude at cello pitch ✓, Casals ✓ | Samples cover only E1–A2: 550 of 656 notes are synthesised; needs a full-range set |
| 5-string bass | 24 frets ✓, low B | Bach Prélude ✓ | Shares the 4-string recordings: B0–D#1 re-pitched or synthesised |
| Banjo (6-string, guitar tuning) | 22 frets ✓ | Bach Prélude, Claro de Luna ✓ | 25 recordings, D2–C5 (CC0), one take each; synth tone colour furthest from the real one (32 dB); no 5-string drone banjo yet |
| 12-string (steel) | 20 frets ✓, octave and unison courses | Bach Prélude ✓ | Courses share the steel recordings (each pair re-pitched from its partner's); the headstock still draws six pegs |
| 7-string (electric) | 24 frets ✓, low B | Bach Prélude ✓ | Low B (B1) re-pitched from the electric set; one take per note |
| 6-string bass | 24 frets ✓, low B and high C | Bach Prélude ✓ | Shares the bass recordings: the high C string is re-pitched or synthesised |
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
- ~~12-string guitar~~, ~~7-string guitar~~ (shipped 2026-11-06), 8-string guitar, baritone guitar
- ~~5-string bass~~, ~~6-string bass~~ (shipped), fretless bass (continuous pitch), acoustic bass guitar
- Chord shapes and tunings now follow the family (guitar or bass, by range), not the string count — what a
  6-string bass needed, and what a 4-string ukulele will need
- ~~Ukulele~~ (shipped 2026-11-06 with its own chord shapes and tunings, synth voice — still no freely licensed
  ukulele recordings), tenor and baritone ukulele, guitalele
- ~~Mandolin~~, ~~Irish bouzouki~~, ~~Greek bouzouki~~, ~~balalaika~~ (shipped 2026-11-06, synth voices); mandola,
  tremolo picking
- Banjo: ~~6-string guitar banjo~~ (shipped); 5-string with the short drone string (needs re-entrant tuning and
  its own chord shapes; the only free set found, FlameStudios Kay, is GPL-3.0), 4-string tenor; resonator guitar / dobro
- ~~Bağlama / saz~~ (shipped 2026-11-06: 17 frets an octave at Yalçın Tura's ratios, three courses with octave
  strings, seven düzens; synth voice only — no freely licensed recordings found yet, the voice-catalog test lists it
  as awaiting them; self-play can't finger its in-between frets yet), cura, tanbur, cümbüş
- Oud and fretless lutes (continuous pitch, maqam intonation), Renaissance lute, sitar (sympathetic strings)
- Lap steel and pedal steel (slide bar instead of frets)

**Plucked or struck without a fretting hand**
- Harp (concert, Celtic), kanun (with mandal pitch levers), santur / hammered dulcimer, kalimba

**Bowed (needs a bow gesture: hand speed → loudness, continuous pitch)**
- Violin, viola, cello, double bass, kemençe, erhu

**Keyboards (finger-per-key tracking)**
- ~~Piano~~ (shipped 2026-11-06: every fingertip of both hands presses keys through two lines — over the black
  keys, then below them — velocity from speed; mouse and multi-touch; Space is the sustain pedal; 3 octaves on
  a wide screen, 2 on a tablet, C4–E5 on a phone; CC0 Kawai upright recordings, in tune within 0.5 c above C2).
  Glissando by sliding a pressed finger (no key skipped) and an octave shift to all 88 keys shipped next.
  Open: self-play and lessons on the piano (the self-playing hand is a
  guitarist's), a real-song test, the pedal inputs as sustain, more than one dynamic layer.
- ~~Harpsichord~~ (shipped 2026-11-06: plucked by the string synth, F1–F6, no dynamics, French dark naturals)
- Electric piano, organ, accordion, synthesizer (need a sustained or struck-tine voice the string synth can't give)

**Percussion (reuse the drum kit's stick and pad code)**
- ~~Darbuka, def, bendir, cajón, congas, bongos, djembe, tabla, handpan~~ (shipped 2026-11-06: hand drums are data —
  heads and strokes — for one player and one voice); the darbuka (Commons, CC BY-SA) and congas (VSCO 2 CE, CC0) play
  real recordings, the rest are synthesised until recordings are found; timpani (pitched, pedal)
- ~~Mallets: marimba, xylophone, glockenspiel~~ (shipped 2026-11-06: VSCO-2-CE recordings, bars ring on after the key rises). Vibraphone still open (no free recordings found yet)
- ~~Winds from the keys: clarinet, flute, trumpet~~ (shipped 2026-11-06: VSCO-2-CE sustained recordings, a note held while the key is down). Oboe, bassoon, horn, trombone and tuba followed the same day. Next: a breath control (hand height or the microphone) for swells; notes longer than the 6 s takes

**Air-only**
- Theremin (pitch from one hand's height, volume from the other) — the most natural webcam instrument

## Instrument voices — ranked versions of each instrument — `shipped`
Keep several voices per instrument — e.g. recorded set A, recorded set B, the synth fitted to recordings, the
original hand-tuned synth — and score all of them with the same real-instrument test
(`instruments-vs-real.audio.test.ts`: pitch, decay, tone colour; plus the real-song tests). The best score is the
default; the others stay selectable in settings as the second and third option, so a player can pick by ear and
the ranking shows what to improve next. Shipped: Settings → Sound (`voice-catalog.ts`); the ranking test is in
`instruments-vs-real.audio.test.ts`. Open: a second recorded set per instrument, and more than one take per note
for electric and bass so their recorded voice is scored fairly.

## Hands-only view — `shipped`
A button that hides the camera picture: the stage shows only the instrument and the tracked hands as their
skeleton (the landmark points and the lines between them), with the existing strum and fret highlights. Cleaner
to look at, nothing personal on screen (good for recording or streaming), and still shows exactly what the app
sees. Tracking keeps running; only the video layer is hidden. Persisted like the other display settings.
Shipped as the camera button in the top bar (`isCameraHidden`, `paintHandSkeleton`); QA rows H1–H6.

## Play-along — karaoke for instruments — `idea`
Karaoke, but you play instead of sing: pick a song, the band (backing track or recording) plays every other
part, and your instrument's part scrolls by in time — chords, notes or drum hits — scored as you go. Your part
is muted in the mix so you fill the gap; a "guide" level brings it back while learning. Builds on the lesson
timeline, the shadow guide and the real-song tests (tempo and alignment against a recording). Songs: public
domain or the player's own files; backing tracks for copyrighted songs need licensing.

## Self-play — the *Watch it play* mode — `shipped`
After Start, *Watch it play* is the fourth mode in the mode switch: pick a song from the list beside it — the
instrument's showcase piece first (Bach on the steel string, Greensleeves on nylon, power chords on the overdrive,
Oh! Susanna on the banjo, a boogie line on the bass), then every song it can play, the player's own included — and
play or stop it. Every song's intro opens the mode with that song. A hand skeleton plays: fingers land on the frets
just before each note, the pick crosses each string as it sounds, the strings vibrate. The player can join in: a
stroke (mouse or strumming hand) sounds what the playing hand holds. `DemoController`, `DemoPerformer`,
`watchableSongs`; a test plays every song of every instrument's list and checks each note is the fret the hand
holds. QA S1–S12.

## Camera on and off — `shipped`
The camera switch in the top bar turns the camera off (light out, no tracking; mouse, touch and keys play) and on
again; remembered, so Start doesn't ask for the camera while it is off. `CameraController`; QA K1–K4.

## Video recording — `shipped`
Record yourself playing: the record button in the top bar captures the stage — the camera picture as the page
shows it, the instrument, the hands or their skeleton, the hit highlights — with everything the instrument plays,
then opens a preview with *Save video* (MP4 where the browser can write it, otherwise WebM) and *Discard*. Nothing
is uploaded. The hands-only view makes a clip with nothing personal in it; self-play can be recorded as a demo.
Clips stop at 10 minutes. `StageCompositor` + `BrowserClipRecorder` (`MediaRecorder`), sound from the engine's
output; QA W1–W10. Open: record the microphone too (sing along), trim before saving, a share button on phones
(Web Share with files).

## Practice loop — `idea`
Pick a few bars of a lesson and loop them, slower at first and up to full tempo as the score improves —
what Rocksmith's Riff Repeater does and players miss most elsewhere (seamless loops, short sections, pause).
Builds on the lesson timeline and the tempo choice; the real-song tests keep 100 % honest.

## Onboarding — what comparable apps do (2026-11-05) — partly `shipped`
Simply Guitar and Fender Play move a new player one task at a time to a first sound; Handel (a webcam
instrument) plays before camera access. Shipped: first Start runs the tour (not every feature at once), a
"Start playing" path from home, the no-camera route on the start card. Open: a skill question before the
first lesson (first-timer · knows chords · plays already) to pick where the course starts, and a daily
practice goal.

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
