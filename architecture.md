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

## Sound

`public/worklets/strings.js` is an extended Karplus–Strong string bank in an AudioWorklet:
noise excitation shaped by pick position and velocity, a two-tap loss filter (brightness), a
first-order allpass for exact tuning (tested to within 2 cents), and per-pluck T60 decay. Plucks
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
