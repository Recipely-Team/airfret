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

## Data

**A module-level constant used before it was initialised crashed the whole lesson catalogue.**
`SONGS` called a helper that read a `const` declared further down the file (temporal dead zone),
so importing the catalogue threw. *Guard:* `parse-song.test.ts` parses every song in the
catalogue, which imports it; the helper now uses `@domain/music/pitch` instead of a local table.

## Input

**Lifting the hand after a downstroke played an upstroke.** A webcam has no depth, so the
return path crosses the strings the same way a strum does. (Also reported by other air-guitar
projects.) *Guard:* the *Down only* strum filter, covered by `player.test.ts`
("ignores upstrokes when the strum filter is down-only").
