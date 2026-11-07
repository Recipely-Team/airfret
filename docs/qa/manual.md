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
| A4 | First Start (the tour runs) → *Exit tour* | Chords · Notes · Free (Pro) · Watch it play are usable at once (they used to stay greyed out) | |

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

## C3. More strings

| # | Step | Expected | Result |
|---|---|---|---|
| C3.1 | `/12-string` → strum | Each course drawn as two strings; every stroke rings both — the low four an octave higher too: a wide, shimmering chord | |
| C3.2 | `/7-string` → Chords → strum G | The low B stays silent; the chord sounds on the upper six. Settings → Tuning offers Standard, Drop A, Half step down | |
| C3.3 | `/bass-6` → Chords → strum | A bass outline (root, fifth, octave, third, high root) from the E string; the low B silent. Tunings are bass tunings | |
| C3.4 | Each of the three → *Watch it play* | Plays with sound: Canon in D, House of the Rising Sun, the Prélude on bass | |

## C4. Piano

| # | Step | Expected | Result |
|---|---|---|---|
| C4.1 | `/piano` → Start | A keyboard with ivory and ebony keys, every C labelled (C4 = middle C); no modes or chord sets in the top bar | |
| C4.2 | Hands over the keys, still, then moving around | Nothing plays and no key stays lit; then press one finger down (below the others) on a white key, then a black key: each sounds once, stays lit while the finger is down, stops when it comes up | |
| C4.3 | Three fingers at once, both hands | A chord; a fast stroke is louder than a slow one | |
| C4.4 | No camera: click a key, drag across several, touch with two fingers | Each plays; dragging plays each key it reaches; two touches play two notes | |
| C4.5 | Hold Space, play, release a key, then release Space | Notes ring on while Space is held and stop when it's let go | |
| C4.6 | Phone width | C4 to E5 fills the screen; the top bar fits | |
| C4.7 | Press a key with a fingertip and slide sideways without lifting | A glissando: every white key it passes sounds once (black keys if it started on a black key), even a fast slide | |
| C4.8 | Mouse or touch: press and drag fast across the keyboard | Every key on the way plays, none skipped | |
| C4.9 | ◀ ▶ in the top bar, or ← → | The keyboard slides an octave; the range shows between the arrows; A0 and C8 are the ends | |
| C4.10 | `/harpsichord` | Dark naturals, light sharps; F1 to F6 with ◀ ▶; every key equally loud however it is struck; a key stops when it rises | |
| C4.11 | `/marimba`, `/xylophone`, `/glockenspiel` → Start | Wooden (rosewood) or steel bars, no black-and-white keys; press a bar and lift the finger: the note rings on (recorded, not synthesised); the arrows stop at A2–C7, F4–C8, G5–C8 | |
| C4.12 | `/clarinet`, `/flute`, `/trumpet` → Start | Hold a key: the recorded note sustains (up to 6 s) and stops the moment the finger lifts; a faster press is louder; the arrows stop at D3–G6, C4–C7, F3–C6 | |
| C4.13 | `/oboe`, `/bassoon`, `/horn`, `/trombone`, `/tuba` → Start | As C4.12: each holds its recorded note while the key is down; the arrows stop at A3–F6, A1–E5, C2–F5, A1–F4, F1–D4 | |

## C5. Saz (baglama)

| # | Step | Expected | Result |
|---|---|---|---|
| C5.1 | `/saz` → Start | A long neck with 17 frets an octave (some pairs close together: the in-between notes), three doubled courses, a pear-shaped bowl; modes are Notes and Free only | |
| C5.2 | Notes → keys 1–9, strum | Each fret sounds its own pitch; fret 2 is a neutral second (between a semitone and a tone) | |
| C5.3 | Settings → Tuning | The duzens: Bozuk, Baglama, Misket, Abdal, Acem, Kutahya, Mustezat; Baglama lowers the top course to E | |
| C5.4 | Free mode with the camera | Fingers on any fret, the in-between ones included, sound their microtonal notes | |

## C6. Ukulele, mandolin, balalaika, bouzoukis

| # | Step | Expected | Result |
|---|---|---|---|
| C6.1 | `/ukulele` → Chords → strum each chip | Each chord sounds as a ukulele plays it (G = G D G B); Settings → Tuning has Standard and Low G | |
| C6.2 | `/mandolin` → Notes, strum | Four doubled courses in fifths (G D A E); bright and short | |
| C6.3 | `/balalaika` | A triangular body; strings E E A; tunings include "Guitar" G B D, Domra E A D, Folk D F# A and C E G | |
| C6.4 | `/bouzouki` and `/greek-bouzouki` | G D A D in four unison courses; the Greek one D A D, its low course with an octave string | |

## C7. Hand drums (darbuka, def, bendir, cajón, congas, bongos, djembe, tabla, handpan)

| # | Step | Expected | Result |
|---|---|---|---|
| C7.1 | Each page from Home → Drums & percussion | The drum drawn by its kind (copper goblet, frame with jingles, wooden box, barrels, steel dome); stroke names where they are played; no modes in the top bar | |
| C7.2 | Fingertips (index, middle, ring) striking the middle of a head | Its centre stroke (düm, bass, ge, tin, or the handpan field's note), louder the faster; a resting finger doesn't repeat | |
| C7.3 | Right hand on an edge, then left hand on the edge | The right-hand edge stroke (tek, open, tone, na), then the left (ka, slap) | |
| C7.4 | No camera: click the middle and each edge of each head | Each stroke sounds with a ripple; on the handpan each field plays its note of D Kurd | |

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
## S. Self-play — the *Watch it play* mode

| # | Step | Expected | Result |
|---|---|---|---|
| S1 | `/acoustic` → Start → mode switch | Four modes: Chords · Notes · Free (Pro) · *Watch it play* (Turkish: *Kendi çalsın*); none on the drums; the start card has no self-play button | |
| S2 | Pick *Watch it play* | A song list and *Stop* appear (the chord set hides); the steel string's Bach starts at once — a hand skeleton plays it, fingertips on the frets, the pick moving string to string | |
| S3 | Open the song list | The instrument's own piece first, then every song it can play — guitars get the guitar songs, basses the bass songs, your own songs included | |
| S4 | Choose *Happy Birthday — melody* | It plays at once: the tune, with a bass note under each bar | |
| S5 | *Stop*, then *Play* | Stops and starts the chosen song; the mode stays on. When a song ends the mode stays too | |
| S6 | Listen at normal volume | As loud as playing yourself, also on single-note melodies | |
| S7 | Pick *Chords* (or start a lesson, go home) | The song stops and the list hides | |
| S8 | While it plays, strum with the mouse or your strumming hand | Your strokes sound the notes the playing hand holds; your hand shows as a second skeleton | |
| S9 | Lessons → any song → *Watch it play* | The song's instrument opens in the mode with that song chosen and playing (also for a song you added) | |
| S10 | A chord piece (`/overdrive`, `/banjo`) | The chord name and chart change with the music; the shape on the neck is the one sounding | |
| S13 | While it plays, rest a finger (mouse or touch) on a ringing string | It stops, like on a real guitar — whoever plucked it | |
| S14 | Tap one string (no swipe), with or without self-play | That string plays once | |
| S15 | Let a song play to its end, then play yourself for a minute | Plays as normally — no stutter, wrong notes or missed strokes | |
| S16 | `/piano`, `/marimba`, `/clarinet`, `/tuba` → Start | The switch reads *You play* · *Watch it play*; picking the latter plays the instrument's piece (Für Elise, the Canon melody, Greensleeves, the boogie bass): keys light as they sound, the keyboard slides to show the tune | |
| S17 | On a wind, choose a song with a bass under it | Only the melody is played, one note at a time; no chord songs are offered on winds | |
| S18 | On the piano, choose a chord song (*Canon in D*) | A bass at each bar and the chord on every beat | |
| S19 | `/darbuka`, `/congas`, `/tabla`, `/handpan` → *Watch it play* | Each plays its own rhythms (maqsum, tumbao, teentaal, a handpan groove); each stroke ripples where it lands — the centre, or the rim on the striking hand's side; the list offers the drum's other rhythms (9/8 karşılama, çiftetelli…) | |
| S20 | `/drums` → *Watch it play* | A crash, then the rock beat (eleven grooves in the list: funk, shuffle, bossa nova, jazz swing…); each pad lights as it is hit; it ends on a crash | |
| S21 | `/ukulele`, `/mandolin`, `/saz`, `/balalaika`, `/bouzouki`, `/greek-bouzouki` → *Watch it play* | Each plays a melody (moved up or down by octaves into its range), the hand on the right frets (on the saz, its 17-an-octave frets); the list offers every melody, and on the ukulele the chord songs too | |
| S11 | iPhone with the silent switch on | The playing is heard | |
| S12 | Phone width and 1280 px | The top bar stays tidy: the list fills the second row on a phone; one line at 1280 px | |

## M. Your own melody

| # | Step | Expected | Result |
|---|---|---|---|
| M1 | Lessons → *Add your own song* → name it, paste a melody as JSON (`{"tempo":108,"timeSignature":"4/4","notes":[{"note":"G4","duration":1},{"note":null,"duration":1}]}`) → Save | The song opens at its own tempo and meter, in note mode | |
| M2 | Or type a melody: `G4:1 A4:0.5 B4:0.5 r:1` | Same, at the form's tempo | |
| M3 | Its intro → *Watch it play* | The acoustic plays your melody by itself | |
| M4 | Type `G4:1 H4:1` | "I can't read the note “H4”…" and nothing is saved | |

## Q. Finding a song (query)

| # | Step | Expected | Result |
|---|---|---|---|
| Q1 | Lessons → type in the search box | The list narrows as you type, groups without a match disappear; "No song matches …" when none does | |
| Q2 | Search in Turkish, with or without Turkish letters (`doğum günü`, `dogum`, `sessiz`, `ninni`) | The birthday songs, Silent Night, Twinkle | |
| Q3 | *Watch it play* → the song button → type → Enter | The panel shows only matching songs; Enter plays the first; a click outside or Escape closes it | |

## L. Language

| # | Step | Expected | Result |
|---|---|---|---|
| L1 | Home page foot, start card, foot of the instrument menu | A TR / EN switch in each | |
| L2 | Press TR anywhere | All text turns Turkish at once, every switch shows TR; it stays after a reload | |

## K. Camera on and off

| # | Step | Expected | Result |
|---|---|---|---|
| K1 | After Start, press the camera switch (video icon) | The camera light goes out, the hands-only button hides, the hint says to use the mouse; mouse and keys play | |
| K2 | Press it again | The camera comes back and the hands play again within a second | |
| K3 | Turn it off, reload, press Start | No camera prompt and no camera light: you play with the mouse; turning it on later asks for the camera then | |
| K4 | Deny camera permission, then turn the switch off and on | One error message (not one per click elsewhere); off-and-on tries again | |

## W. Video recording

| # | Step | Expected | Result |
|---|---|---|---|
| W1 | On a stage, press the record button (circle, left of the camera button) | It turns accent-coloured, the dot pulses and a timer counts `0:01`, `0:02`… | |
| W2 | Play a few chords, press it again | *Your recording* opens: a preview with sound, the length, size and format (MP4 in Chrome/Safari, WebM in Firefox) | |
| W3 | Watch the preview | The camera picture (mirrored, dimmed as on the page), the instrument, the hands and their highlights; your playing is heard | |
| W4 | *Save video* | A file `airfret-<page>-<date>-<time>.mp4` downloads (named as the page: `overdrive`, `classical`) and plays in the system player; the dialog closes | |
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
