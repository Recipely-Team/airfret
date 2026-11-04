# Regressions — what broke, and what stops it next time

The lesson, not the incident. Git history records each bug and fix; this file records the
*class* of mistake and the guard that now catches it (CLAUDE.md rule 15). Keep it short; delete a
row that stops teaching anything.

---

## Audio

**The start button did nothing when audio was unlocked from anything but a real click.**
`AudioContext.resume()` only settles inside a user gesture; awaiting it from scripted input hung
the start flow forever. *Guard:* `WebAudioEngine.start()` calls `resume()` without awaiting it —
the context starts on the gesture, and loading the worklet does not depend on it.

**Fast repeated strums crackled and distorted.**
Two causes together. The string worklet allocated two typed arrays per pluck *inside the audio thread*,
so rapid playing triggered garbage-collection pauses there (crackles); and six strings struck within
milliseconds summed above full scale, which the master compressor let through as square clipping.
*Guard:* `string-worklet.test.ts` counts allocations during `process()` while strumming fast (must be 0)
and checks the bank's peak; the master output now ends in a hard-knee limiter plus a `0.97·tanh` soft clip.

**The top frets of the nylon guitar played up to 20 cents flat.**
Its recordings there are 20–40 cents flat, and `SampleSet` capped the tuning correction at 20 cents
"because large re-pitching sounds unnatural", though notes are routinely re-pitched by whole semitones.
*Guard:* the correction cap matches the sample tool's own analysis limit (60 c); `sample-set.test.ts`
"plays the top frets in tune…", and `tests/songs/instruments-vs-real.audio.test.ts` measures every
instrument's notes against true pitch.

**Tuning corrections made many sampled notes more out of tune, not less (up to 18 c).**
The corrections were measured with `analyze()`'s inharmonicity fit, which over-reads a pitch offset by
about 60 % (a 13 c error read as 21 c). Nobody had checked the meter itself. *Guard:* pitch is now read by
`tools/calibrate/pitch.mjs` (long-FFT fundamental); `tools/samples/retune-manifest.mjs` re-measured every
manifest; the instruments-vs-real test first proves the meter reads known shifts exactly, then requires
every played note within 3 c.

**Moving any setting — even the volume slider — cut off ringing recorded notes.**
The app re-applies the instrument on every settings change, and the engine answered each one by dropping
its sample set and loading it again, which stops every note the set is playing. *Guard:* `useSamples`
returns early unless the set actually changes (comment there); manual QA row V4.

## Drums

**Drumsticks vanished and reappeared, or jumped to the other hand.**
A stick was rebuilt from scratch every frame from hands sorted left to right: one lost frame (fast
strokes blur) removed it, and when one hand dropped out the other hand's stick took its slot.
*Guard:* `StickTracker` keeps each stick bound to its hand by nearest wrist, holds it for 0.4 s through
dropouts, and smooths it; `stick-tracker.test.ts` covers dropout, swap and crossing hands.

**Strumming up and down cut the notes off instead of letting them ring.**
Two things fought a real guitar's behaviour: a new pluck on a ringing string faded the old vibration out
in 35 ms and started a fresh voice (a cut and restart), and the fingertip merely passing over a string on
its way damped it. *Guard:* the worklet re-strikes the same waveguide, blending the new stroke into the
vibration (`string-worklet.test.ts`: one voice, a light brush keeps ~full ring); only a fingertip resting
≥ 0.15 s damps (`player.test.ts`: passing over doesn't cut, resting does).

## Navigation

**The ☰ next to the logo looked like a menu and did nothing.**
It was decoration in the brand mark. *Guard:* it is now a real button (`aria-expanded`, `aria-controls`)
opening the navigation drawer; every instrument has its own path (`route-paths.test.ts`).

## Data

**A module-level constant used before it was initialised crashed the whole lesson catalogue.**
`SONGS` called a helper that read a `const` declared further down the file (temporal dead zone),
so importing the catalogue threw. *Guard:* `parse-song.test.ts` parses every song in the
catalogue, which imports it; the helper now uses `@domain/music/pitch` instead of a local table.

## Input

**A curled index finger fretting one string was read as a barre.**
Seen from the front, an arched finger's PIP→tip segment passes over the strings between the knuckle
and the fingertip, so "segment crosses ≥ 3 strings" fired on ordinary fretting. *Guard:* a barre must
be flat — all three joints on the strings, nearly straight, along the fret wire. Test
`map-fretting.test.ts` ("does not mistake an arched finger reaching one string for a barre").

**Lifting the hand after a downstroke played an upstroke.** A webcam has no depth, so the
return path crosses the strings the same way a strum does. (Also reported by other air-guitar
projects.) *Guard:* the *Down only* strum filter, covered by `player.test.ts`
("ignores upstrokes when the strum filter is down-only").

## Flow

**Escape didn't close Explore or a lesson's intro, and the very first Start buried the stage under all
fifteen Explore cards.** Escape only knew the popovers and the lessons drawer; the first-run guide showed
every feature at once. *Guard:* Escape closes every overlay, then `closeOverlay()` puts the address back (it only rewrites the URL, never closes anything — the cause);
the first run starts the guided tour instead (`tour-instrument.test.ts`); QA rows N6, N7.

## Tools

**The sample tools silently dropped SFZ regions they didn't expect.** SFZ lets a region leave out
`pitch_keycenter` (it defaults to 60), put `sample=` before its key, and use `\` in paths. `prepare.mjs`
skipped the keyless region (a banjo lost its C4) and `measure-refs.mjs` skipped every region written
sample-first (all 58 of the banjo's) — no error either time. *Guard:* both read a region when it ends, with
the spec's default key and `/` paths; `instruments-vs-real.audio.test.ts` plays every recorded note in tune,
and `public/samples/CREDITS.md` records how many regions each set kept.
