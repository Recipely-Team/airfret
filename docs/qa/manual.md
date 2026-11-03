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

## C. Instruments and notes

| # | Step | Expected | Result |
|---|---|---|---|
| C1 | Switch through all five instruments, strum each | Distinct timbres; no clicks or dropouts | |
| C2 | Overdrive: strum a power chord | Distorted, no harsh fizz, no clipping pops | |
| C3 | Bass (note mode): finger on fret 5, pluck each string | A, D, G, C | |
| C4 | Keys 1–8 (chord mode), 0–9 (note mode) without a camera | Selection follows the keys | |

## D. Lessons

| # | Step | Expected | Result |
|---|---|---|---|
| D1 | Lessons → *Em – Am* → Start (wait mode) | Count-in 4…1, timeline stops at the first target until Em is strummed | |
| D2 | Strum the wrong chord | "Wrong chord", timeline stays | |
| D3 | Play along mode, 100 %, drums on | Groove in time; on-time strums grade Perfect/Good | |
| D4 | Finish a lesson | Result card with accuracy; best score shows in the list | |
| D5 | Melody lesson (Twinkle) | Next note's string and fret highlighted on the neck | |

## Report

```
Machine/browser:
F/B rows (id — note):
```
