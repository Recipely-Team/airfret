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

## Fingerstyle and riffs — `idea`
Single-string picking with several fingers (one per string) for arpeggios like *House of the Rising Sun*.
