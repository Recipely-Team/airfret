# Architecture

Airfret follows the same layered, domain-driven structure as Recipely, scaled to a single-page
browser app with no backend. Rules in short are in [`CLAUDE.md`](CLAUDE.md); this file explains them.

## Layers

| Layer | Holds | May import |
|---|---|---|
| `core/` | `Result`, `Failure`, `clamp` — reusable in any project | nothing |
| `domain/` | Music theory, instruments, fretboard geometry, gesture detection, lesson charts and sessions, settings model, **ports** | core |
| `application/` | `Player` (hands → notes), `StartLessonUseCase`, `BackingTrack`, `SettingsStore` | core, domain |
| `infrastructure/` | `WebAudioEngine`, `MediaPipeHandTracker`, `LocalStorageSettingsRepository`, asset/storage constants | core, domain |
| `presentation/` | Canvas painters, DOM widgets, i18n, `AirfretApp` loop, `bootstrap/` | core, domain, application, `@infrastructure/constants/*` |

`presentation/bootstrap/main.ts` is the **composition root**: the only file that names concrete
infrastructure classes. It builds the adapters and injects them through their ports. Plain
constructor injection is enough at this size, so there is no DI container.

### Ports

| Port (domain) | Adapter (infrastructure) | Why it's a port |
|---|---|---|
| `SoundOutputInterface` | `WebAudioEngine` | The player and lessons decide *what* sounds and *when*; Web Audio is how. Tests use `FakeSoundOutput`. |
| `HandTrackerInterface` | `MediaPipeHandTracker` | Camera + model loading fail in many ways; the app only sees `Result` and landmarks. |
| `SettingsRepositoryInterface` | `LocalStorageSettingsRepository` | Storage can be blocked (private windows); the store never needs to know. |

## Capability folders

Domain is grouped by what the code is *for*:

- `music/` — pitch, tunings, chord shapes and voicings, fret positions.
- `instruments/` — the instrument catalogue and its vocabularies (`ChainKind`, `PlayMode`).
- `fretboard/` — screen geometry of the virtual instrument: neck, frets, chord boxes, strum area.
- `gesture/` — `StrumDetector` (string crossings with hysteresis and sub-frame timing), `OneEuroFilter`.
- `tracking/` — landmark indices, hand pose, the tracker port.
- `lessons/catalog` (songs, chord sets) → `lessons/chart` (text notation → targets) → `lessons/session` (clock, judging).
- `settings/`, `audio/` — models and ports.

## The interaction model

1. The camera frame is mirrored, so a right-handed player's fretting hand appears on the left.
   Two hands: the one nearer the neck frets. One hand: whichever side it's on (`assignHands`).
2. **Fretting hand** — its index fingertip (One-Euro smoothed) selects a chord box or a fret. A fist
   on the neck (no extended fingers for two frames) mutes and damps the strings.
3. **Strumming hand** — its index fingertip is the pick. Each string has an armed side; crossing from
   clearly above to clearly below (beyond a hysteresis band) plays it. Strings crossed in one frame
   get sub-frame offsets from where the path meets them, so a fast strum spreads naturally.
   Speed → loudness. Long tracking gaps forget the position, so a re-appearing hand doesn't strum.
4. A webcam has no depth: lifting the hand back after a downstroke can read as an upstroke. The
   *Strum direction → Down only* setting filters upstrokes.

## Free (pro) mode — the maths

- **Fretting** (`domain/fretboard/map-fretting.ts`): each fingertip snaps to the nearest string line at
  its x (hysteresis: it changes string only when another is 25 % of the spacing closer) and to the fret
  zone under it. A string sounds its highest pressed fret.
- **Barre**: a *flat* index finger — PIP, DIP and tip all on the strings, bend at the DIP < 25°, lying
  along the fret wire — frets every string it covers. An arched finger fails the first test.
- **Bends**: pitch rises with string tension, tension with elongation, elongation with the square of the
  sideways push δ, so bend = 2 · ((|δ| − dead zone) / range)² semitones.
- **Legato** (`application/play/legato-tracker.ts`): a fret change on a ringing string retunes it — same
  finger = slide (glide, no attack), another finger = hammer-on / pull-off (fast change + a little energy).
- **Chord recognition** (`domain/music/chords/recognize-chord.ts`): every pitch class is tried as root
  against 14 interval templates; score = 2·matched − 1.6·extra − 1.1·missing + 0.6 if the root is the bass.
  Lessons in free mode judge the chord you actually played, by root and quality.

## The strumming finger

- **Pluck position** = (bridge − x) / (bridge − fretted fret): near the bridge ≈ 0.05 (thin, bright),
  over the soundhole ≈ 0.25 (warm), near the neck ≈ 0.45 (round, dark). It sets the comb in the
  excitation (plucking at 1/k of the length removes every k-th harmonic) and the brightness.
- **Nail or pad** (`domain/gesture/finger-strike.ts`): back-of-hand normal
  n = (indexMCP − wrist) × (pinkyMCP − wrist) using MediaPipe depth; the nail faces n projected
  perpendicular to the finger axis. Nail facing the stroke → nail (brighter, pick tick); otherwise pad.
- **Won't play**: a curled finger, a finger pointing up away from the strings, or one pointing at the camera.
- **Contact**: crossing a string's line bends it under the fingertip (drawn as a tent); it plucks when the
  tip passes the release band. Touching a ringing string stops it.
- **Palm mute**: the strumming palm edge resting on the strings by the bridge shortens and darkens notes.

## Shadow mode

`GuidePlayer` plays every lesson target on a separate **guide voice** (its own string bank and gain),
scheduled on the audio clock; the player's own voice has its own volume. The renderer shows the guide's
ghost pick sweeping the strings and the target chord's shape ghosted on the neck.

## Sound

`public/worklets/strings.js` is a digital-waveguide string bank in an AudioWorklet: a delay line read
at a fractional, time-varying point (cubic Hermite), a two-tap loss filter (brightness), a dispersion
allpass (string stiffness → inharmonicity), and per-note T60. The line is shortened by the filters'
*exact* phase delay at the target frequency, so pitch is within 2 cents; because the read point can
move, a ringing string can bend, slide and hammer on. Plucks
are scheduled sample-accurately on the audio clock. Each instrument family then runs through
its own chain (`infrastructure/audio/chains/build-chain.ts`): body EQ for acoustic/nylon, chorus
for clean electric, preamp + clipper + 4x12 cabinet EQ for overdrive, compressed low end for bass.

## Lessons

`parseSong` turns the compact notation into a `SongChart` (chord segments + targets).
`LessonSession` is the aggregate for one run: `LessonClock` maps audio time to beats and can
freeze on a beat (wait mode); input is judged against timing windows (±85 ms perfect, ±170 ms
good) after subtracting the configured camera latency. Click/drum beats are scheduled 120 ms ahead.

## Testing

| Layer | How |
|---|---|
| domain, core | Pure unit tests. |
| application | Hand-written fakes of the ports; no mocks. |
| infrastructure | The string worklet is run in a fake `AudioWorkletGlobalScope` and its pitch measured. |
| presentation | Locale parity. Rendering, camera and audio output are checked by hand: `docs/qa/manual.md`. |
