# Airfret — manual QA

Camera, rendering and sound can't be checked by unit tests. Run this pass before a release
(`dev → main`) and after any change to tracking, the player, painters or the audio engine.

Mark each row: `P` pass · `F` fail · `B` blocked (say why) · `S` skipped. Only `F` and `B` need a note.

| Field | Value |
|---|---|
| Machine / camera | |
| Browser + version | |
| Build | local `npm run dev` / preview URL / production |
| Lighting | |

## A. Start

| # | Step | Expected | Result |
|---|---|---|---|
| A1 | Open the app | Start card over a dimmed instrument; language matches the browser | |
| A2 | Click **Start**, allow the camera | Card closes; mirrored video appears behind the instrument | |
| A3 | Reload, click **Start**, deny the camera | Card closes; toast explains; mouse-strum hint visible | |

## B. Chords (acoustic)

| # | Step | Expected | Result |
|---|---|---|---|
| B1 | Left index finger on each chord box | Box fills; chord diagram (bottom-left) follows | |
| B2 | Right index finger strums down through the strings | Chord sounds, low → high; strings vibrate | |
| B3 | Strum fast vs slow | Fast is clearly louder | |
| B4 | Hold the right hand still on a string for 5 s | No sound | |
| B5 | Fist on the neck, strum | Muted "chuck", ringing strings stop | |
| B6 | Settings → Strum direction → Down only; strum up and down | Only downstrokes sound | |
| B7 | Settings → Left-handed | Instrument mirrors; hands swap roles | |

## B2. Touch and tone

| # | Step | Expected | Result |
|---|---|---|---|
| T1 | Push one string slowly with the right fingertip | String bends under the finger, then snaps and sounds | |
| T2 | Pluck near the bridge, then over the soundhole, then near the neck | Bright/thin → warm → soft/dark | |
| T3 | Strum with the nail leading, then the pad | Nail brighter with a tick; label shows *tırnak* / *parmak ucu* | |
| T4 | Point the strumming finger up, or curl it, and sweep the strings | No sound; label shows *parmak ters* | |
| T5 | Rest the right palm edge on the strings by the bridge and strum | Short, dark palm-muted chug | |
| T6 | Touch a ringing string | It stops | |

## B3. Free (pro) mode

| # | Step | Expected | Result |
|---|---|---|---|
| F1 | Fret a real G shape, strum | Plays G; "G" appears above the neck | |
| F2 | Lay the index finger flat across fret 5 (barre), hand at your usual distance | All strings fretted at 5; one bar drawn across them | |
| F2b | Index flat from the D string down (partial barre); then the ring finger flat across D–G–B | Only the strings from the tip down sound at that fret | |
| F3 | Pluck a string, then land another finger higher on it | Hammer-on: pitch changes without a new pluck | |
| F4 | Pluck, then slide the same finger 2 frets | Pitch glides | |
| F5 | Fret, pluck, push the string sideways | Pitch bends up, ~2 semitones at most | |
| F7 | Open G with the pinky curled under the neck | Plays G: the high e stays at fret 3 | |
| F8 | Pluck the G string at fret 7, push it up most of the way to the D string | Bends about a whole step and stays on G | |
| F9 | Hold a note with the fingertip just behind the wire, keep still | Pitch steady, no warble between two frets | |
| F10 | Arch the ring finger onto the A string from below | Only the A string is fretted (no barre) | |
| F11 | A chord: three fingers on fret 2 | D, G and B all sound fret 2 | |
| F6 | Settings → Capo 2, Tuning Drop D | Capo bar drawn; open G shape sounds A; low string down a tone | |

## C. Instruments and notes

| # | Step | Expected | Result |
|---|---|---|---|
| C1 | Switch through all five instruments, strum each | Distinct timbres; no clicks or dropouts | |
| C2 | Overdrive: strum a power chord | Distorted, no harsh fizz, no clipping pops | |
| C3 | Bass (note mode): finger on fret 5, pluck each string | A, D, G, C | |
| C4 | Keys 1–8 (chord mode), 0–9 (note mode) without a camera | Selection follows the keys | |

## C2. Drums

| # | Step | Expected | Result |
|---|---|---|---|
| K1 | Instrument → Davul, show both hands as loose fists | A stick appears in each hand, following it | |
| K2 | Bring a stick down onto the snare, then the toms and cymbals | Each sounds; harder is louder; cymbals wobble | |
| K3 | Snare edge vs centre; ride centre vs edge | Rimshot crack at the edge; ride bell at the centre | |
| K4 | Hold a stick still on a drum | No repeated hits | |
| K5 | Space / B | Kick; the kick pedal lights | |
| K6 | Hi-hat with left Shift held / released (both pedal modes) | Open / closed as the mode says; closing chokes an open hat | |
| K7 | Pedals → + Ata → press another key / controller button / MIDI pedal | It plays that pedal; removing the chip stops it; reset restores defaults | |

## N. Navigation

| # | Step | Expected | Result |
|---|---|---|---|
| N1 | ☰ | Menu opens with Home, eight instruments, Learn, Settings; current page highlighted | |
| N2 | Open `/bass`, `/drums`, `/electric` directly (reload) | That instrument's page, with the start card | |
| N3 | Back / Forward | Moves between pages | |
| N4 | Dersler → close | Back on the page you came from | |
| N5 | Strum fast and repeatedly for 10 s | No crackle, no harsh distortion | |
| N6 | Open Explore, then a lesson's intro, then Lessons; press Escape each time | Each closes back to the page under it | |
| N7 | Private window → `/banjo` → Start | The guided tour starts on the banjo — no wall of Explore cards. On `/drums` nothing opens | |
| N8 | Home on a phone (390 px wide) | "Start playing" first; instruments as compact rows under Guitars · Bass · Drums; no `/slug` labels; toolbar on one row, no camera button | |
| N9 | `/acoustic` on a phone, chord mode | Chord names don't overlap; the chord card doesn't cover the "show your hands" hint | |

## E. Explore

| # | Step | Expected | Result |
|---|---|---|---|
| E1 | First start | Explore opens once by itself | |
| E2 | Each card's "Dene" | Sets the app up for that feature and says what to do | |

## D. Lessons

| # | Step | Expected | Result |
|---|---|---|---|
| D1 | Lessons → *Em – Am* → Start (wait mode) | Count-in 4…1, timeline stops at the first target until Em is strummed | |
| D2 | Strum the wrong chord | "Wrong chord", timeline stays | |
| D3 | Play along mode, 100 %, drums on | Groove in time; on-time strums grade Perfect/Good | |
| D4 | Finish a lesson | Result card with accuracy; best score shows in the list | |
| D5 | Melody lesson (Twinkle) | Next note's string and fret highlighted on the neck | |
| D6 | Shadow mode lesson | Guide plays on the beat; ghost pick sweeps; *Rehber* / *Ben* sliders change each voice | |
| D7 | Lessons → Guided tour | Each step advances only after doing it; last step opens lesson 1 | |

## Report

```
Machine/browser:
F/B rows (id — note):
```

## R. Real samples and real songs

| # | Step | Expected | Result |
|---|---|---|---|
| R1 | Open acoustic, nylon, electric, bass in turn; strum within the first second | Synth at first, then recorded strings once the set has loaded; no gap or click at the switch | |
| R2 | Network tab while switching instruments | Each set's files load once; switching back doesn't reload them | |
| R3 | Lessons → *Claro de Luna*, shadow mode | Tuning switches to drop D; guide plays bass, triplets and melody together at 60 bpm | |
| R4 | Lessons → *Cello Suite No. 1 — Prélude* (guitar and bass) | Full piece at 70 bpm (≈ 2 min 22 s from first note to last), as Casals plays it | |
| R5 | Bend a ringing note in free mode on a sampled instrument | The recording bends; it doesn't restart | |
| R6 | Open `/banjo`, strum G and C | A round banjo pot (nickel hoop, cream head, floating bridge) fits on screen; a short, bright, snappy recorded sound | |
| R7 | Open `/bass-5`, Notes mode, pluck the top string open and at fret 5 | Five strings, 3+2 headstock; a deep low B, then E — in tune, recorded (not synth) | |
| R8 | `/bass-5` → Settings → Tuning | Standard, Drop A, Half step down — no Drop D | |

## H. Hands-only view

| # | Step | Expected | Result |
|---|---|---|---|
| H1 | Press the camera button (top right, next to Settings) | Camera picture disappears; instrument on near-black; hands show as points and lines, fingertips in the accent colour | |
| H2 | Strum, fret and pluck with the camera hidden | Tracking and sound work exactly as before; strum trail and fret highlights still show | |
| H3 | Drums page with the camera hidden | Skeleton hands hold the sticks; hits work | |
| H4 | Reload the page | The choice is remembered; the button shows pressed (accent) with a slash | |
| H5 | Screen reader / hover on the button | Says "Hide camera — show only the hands", then "Show camera" once pressed (Turkish when the UI is Turkish) | |
| H6 | Explore → *Hands only* → Try it | Camera hides and a toast explains how to bring it back | |
## S. Self-play

| # | Step | Expected | Result |
|---|---|---|---|
| S1 | Fresh visit to `/acoustic` → *Watch it play* on the start card (no Start, no camera) | Sound starts; the start card hides; a hand skeleton plays Bach — fingertips on the frets, the pick moving string to string, strings vibrating | |
| S2 | Watch a chord piece (`/overdrive`, `/banjo`) | The chord name and chart change with the music; the shape on the neck is the one sounding | |
| S3 | Press *Stop* in the top bar | Sound stops; the start card is back (if Start wasn't pressed); the tracked hands play again | |
| S4 | Start a lesson, change instrument, or go home while it plays | Self-play stops | |
| S5 | Phone width | *Watch it play* / *Stop* visible under the mode switch | |
| S6 | Press *Watch it play*, listen at normal volume | As loud as playing yourself — not a faint whisper (the guide voice used to stay muted outside lessons) | |

## W. Video recording

| # | Step | Expected | Result |
|---|---|---|---|
| W1 | On a stage, press the record button (circle, left of the camera button) | It turns accent-coloured, the dot pulses and a timer counts `0:01`, `0:02`… | |
| W2 | Play a few chords, press it again | *Your recording* opens: a preview with sound, the length, size and format (MP4 in Chrome/Safari, WebM in Firefox) | |
| W3 | Watch the preview | The camera picture (mirrored, dimmed as on the page), the instrument, the hands and their highlights; your playing is heard | |
| W4 | *Save video* | A file `airfret-<instrument>-<date>-<time>.mp4` downloads and plays in the system player; the dialog closes | |
| W5 | Hide the camera, record again | The clip shows only the instrument and the hand skeleton — no camera picture | |
| W6 | Record, then *Watch it play* | The demo is in the clip with its sound | |
| W7 | Record, then go home or open another instrument | The recording stops and its preview opens | |
| W8 | *Discard*, and press Escape with the dialog open | Discard closes it; Escape doesn't throw a recording away | |
| W9 | Phone width while recording | The top bar stays on one line: the timer replaces the icon, the wordmark hides | |
| W10 | Firefox / Safari | The button appears and records; in a browser that can't record, the button is not shown | |

## V. Instrument voices

| # | Step | Expected | Result |
|---|---|---|---|
| V1 | Settings → Sound on the acoustic | Three options, numbered by rank: 1 · Recorded instrument, 2 · Synth, fitted to recordings, 3 · Synth, classic | |
| V2 | Pick each one and strum | Recorded sounds like the samples; both synths sound synthesised, *classic* dies away faster | |
| V3 | Pick a synth voice, switch to nylon and back | Each instrument remembers its own choice | |
| V4 | Move the volume slider while a recorded chord rings | The chord keeps ringing (it used to be cut off) | |
| V5 | Drums page → Settings | No Sound row | |
