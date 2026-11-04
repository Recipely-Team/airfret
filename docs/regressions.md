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

**Changing note or chord squeaked, and resting a finger on a string scraped.**
The player fired a synthetic "fingers on wound strings" squeak on every fret or chord-box change, and
`touch()` added a noise burst; at playing speed that is a hiss between every pair of notes.
*Guard:* `player-hands.test.ts` ("moving the fretting hand to another chord makes no sound of its own");
the `fretNoise` method is gone from `SoundOutputInterface`, so nothing can schedule it again.

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
