# Airfret

Play guitar and bass in the air. A webcam tracks both hands (MediaPipe Hand
Landmarker, running locally in the browser); a virtual instrument is drawn over
the mirrored camera image, and every note is synthesised in real time.

- **Instruments:** acoustic, nylon, clean electric (chorus), overdrive (amp + cab sim), 4-string bass
- **Chord mode:** left index finger points at a chord box on the neck; right index finger strums across the strings. Speed sets loudness; a fist on the neck mutes.
- **Note mode:** left hand picks a fret (1–12, off the neck = open), right hand plucks single strings.
- **Lessons:** scrolling timeline, count-in, metronome or drum backing, tempo 60–100 %, *wait for me* or *play along* scoring, best scores saved locally.
- **No camera?** Drag the mouse across the strings; keys 1–8 select chords (0–9 frets in note mode).

## Run

```bash
npm install
npm run dev     # http://localhost:5180
npm test
npm run build   # static site in dist/
```

## How it works

| Piece | File |
| --- | --- |
| Karplus–Strong string bank (AudioWorklet, sample-accurate plucks) | `public/worklets/strings.js` |
| Body/amp/cab chains, reverb, drums | `src/audio/engine.ts` |
| Hand tracking + One Euro smoothing | `src/tracking.ts` |
| Neck/fret/chord geometry | `src/play/layout.ts` |
| Strum detection with sub-frame timing | `src/play/strum.ts` |
| Hands → notes | `src/play/player.ts` |
| Lesson clock, scheduling, judging | `src/lesson/lesson.ts` |
| Songs (traditional / public domain / exercises) | `src/lesson/songs.ts` |
