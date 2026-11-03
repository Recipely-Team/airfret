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
| F2 | Lay the index finger flat across fret 5 (barre) | All strings fretted at 5 | |
| F3 | Pluck a string, then land another finger higher on it | Hammer-on: pitch changes without a new pluck | |
| F4 | Pluck, then slide the same finger 2 frets | Pitch glides | |
| F5 | Fret, pluck, push the string sideways | Pitch bends up, ~2 semitones at most | |
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
