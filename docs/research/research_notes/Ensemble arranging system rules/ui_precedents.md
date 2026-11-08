# UI precedents for choosing and customising instrument roles and accompaniment in an auto-arranged ensemble

Scope: control vocabularies, defaults, praise and complaints from auto-accompaniment and arranging software, gathered as input for the controls of Airfret's "band" page. Researched 2026-11-08, using about 16 searches and fetches. Several primary pages (Apple's Logic Pro guide articles, the manualshive Genos manual) could not be fetched, because they returned only a table of contents or an access-denied page. Those points are listed under Gaps.

## Band-in-a-Box: styles, per-track RealTracks, soloist, roles, mute/solo, per-section changes

### Takeaway
Band-in-a-Box has the deepest per-track model of all the precedents. The user picks one whole-band **style**, then can override any single track's instrument/performer ("RealTrack") using a filtered, sortable picker. Each track's mixer panel holds mute, solo and level. Variation between song sections is coarse: an "a"/"b" substyle pair plus intros and endings. This power comes with the field's most persistent complaint, that the interface is dense and overwhelming.

### Cited Findings
- RealTracks are picked per track in a **RealTracks Picker**. A track selector at its top left decides which track receives the choice. The picker opens from the [RealTracks] toolbar button, from the [Library] dropdown, or with hotkeys — [PG Music BiaB 2026 manual, ch.7](https://www.pgmusic.com/manuals/bbw2026full/chapter7.htm)
- **[Apply]** assigns a RealTrack without generating audio. **[Generate]** renders the track. Shift-click on Apply generates and plays from the start — [PG Music 2026 manual](https://www.pgmusic.com/manuals/bbw2026full/chapter7.htm)
- A track's **[+]** button offers "Select Best RealTracks" filtered by **All / Chording / Soloist**, which works as a role filter. A **Find a Sub** command lists similar RealTracks ranked best to worst by genre, feel, tempo and time signature — [PG Music 2026 manual](https://www.pgmusic.com/manuals/bbw2026full/chapter7.htm)
- The picker's **Type** column classifies RealTracks as **Rhythm, Background, Soloist**, BiaB's own role vocabulary. RealTracks can replace the Bass, Guitar, Piano or Strings track. Soloists are generated on the Soloist track — [PG Music 2026 manual](https://www.pgmusic.com/manuals/bbw2026full/chapter7.htm)
- Each track can stack up to 10 RealTracks at once, for a theoretical maximum of 70 instruments (7 tracks × 10) — [PG Music 2026 manual](https://www.pgmusic.com/manuals/bbw2026full/chapter7.htm)
- The per-track **[+]** panel holds solo, mute, freeze, volume, reverb, pan, tone and a track label. **Freeze** saves a performance so it plays back the same way each time — [PG Music 2026 manual](https://www.pgmusic.com/manuals/bbw2026full/chapter7.htm)
- Picker filters:
  - free text, where numbers match tempo
  - genre, instrument, time signature and feel arrows
  - Favorites
  - checkboxes such as "Show RealTracks variations" and "Show if Tempo is out of range"
  - **Timebase**: normal (the default), half-time, double-time or triple-time

  — [PG Music 2026 manual](https://www.pgmusic.com/manuals/bbw2026full/chapter7.htm)
- Ways to make a part simpler:
  - **"Simpler"** RealTracks are less busy and less embellished. A picker column marks them "s".
  - **"Held"** plays held chords only and is called the simplest comping part.
  - **"Simple Drums for this song (no fills)"**.
  - **"Bluesy"** treats major triads as 7ths.

  — [PG Music 2026 manual](https://www.pgmusic.com/manuals/bbw2026full/chapter7.htm)
- 4-bar endings are **on by default** and can be turned off globally or per song. Tempo-based automatic RealTracks substitution ("Allow Auto-RealTracks substitution based on tempo") is also on by default — [PG Music 2026 manual](https://www.pgmusic.com/manuals/bbw2026full/chapter7.htm)
- Changes within a song:
  - drum grooves can change at any bar (right-click a bar number, or use the F5 bar settings dialog, with "Apply Drum Groove change to" choosing which choruses)
  - soloist "medleys" switch instrument every N bars or every chorus
  - Ctrl+F8 regenerates a highlighted section

  — [PG Music 2026 manual](https://www.pgmusic.com/manuals/bbw2026full/chapter7.htm)
- Substyles: a style's patterns can play only in substyle "a", only in "b", or in both. The "b" substyle is typically the chorus/bridge, or the "Swing" part of a jazz style. RealDrums settings can disallow "a" or "b" so that one substyle plays the whole song — [PG Music BiaB 2019 manual ch.13](https://www.pgmusic.com/manuals/bbm2019full/chapter13.htm) (older edition; the wording may have changed since)
- A style can carry a default RealTrack or soloist per track through the More Settings section "Assign Soloist (MIDI) or RealTracks (audio) to style" — [PG Music 2026 manual (search summary)](https://www.pgmusic.com/manuals/bbm2026full/chapter7.htm)
- Complaints:
  - "a forest of hidden commands, pop-up menus, and dialog boxes" — [Synth and Software review 2021](https://synthandsoftware.com/2021/11/band-in-a-box-2021-the-synth-and-software-review/)
  - the interface is criticised as clunky or awkward — [Wikipedia](https://en.wikipedia.org/wiki/Band-in-a-Box)
  - "too cumbersome to use, steep learning curve, and glitchy" — [Pianogroove community](https://community.pianogroove.com/t/band-in-a-box-yay-or-nay/2591)
  - the main screen "has so many options that it is confusing" — [Sax School Online](https://saxschoolonline.com/?p=1538)
  - "confuses the hell out of me" — [AppleInsider forums](https://forums.appleinsider.com/discussion/39381)
- Counterpoint: users say the core becomes usable after a learning investment and that it is good value — [Steel Guitar Forum](https://be.steelguitarforum.com/viewtopic.php?p=3198413); [MacTech](https://www.mactech.com/2010/06/29/freshly-squeezed-reviews-boxed-band)

### Inferences
- BiaB's sound concepts (style as the default, per-track override, role filter Rhythm/Background/Soloist, "Simpler"/"Held" as complexity steps, a/b substyles) are worth borrowing. Its presentation (hotkeys, dialogs, 7×10 track stacking) is the anti-pattern behind the "overwhelming" complaint.
- "Find a Sub" (ranked similar alternatives) is a low-cognitive-load way to change an instrument's part without browsing a full catalogue.

### Gaps
- I did not confirm the exact 2026 list of track names (Bass, Piano, Drums, Guitar, Strings, Melody, Soloist, plus Utility tracks) from the fetched text. The fetched portion did not name them.
- The "All Tracks Equal" feature (BiaB 2022) was not described in the fetched chapter. Its page is [pgmusic.com/bbw2022newfeatures1.htm](https://www.pgmusic.com/bbw2022newfeatures1.htm) and was not fetched.

## Arranger keyboards: Yamaha Genos/PSR, Korg Pa, Roland

### Takeaway
Arranger keyboards fix a fixed set of **parts**, each with a conventional job:
- Rhythm 1/2: drums and percussion
- Bass
- Chord 1/2: rhythmic comping
- Pad: sustained strings, organ or choir
- Phrase 1/2: stabs, arpeggios, ornaments

Each part can be switched on or off. Sections are a small fixed vocabulary (Intro, Main A–D, Fill, Break, Ending). Fills are "programmed to match" the main section and lead into the next variation. One Touch Setting recalls a matching lead voice per style.

### Cited Findings
- Yamaha style parts, with their conventional MIDI channels: 9 Rhythm Sub (Rhythm 1), 10 Rhythm Main (Rhythm 2), 11 Bass, 12 Chord 1, 13 Chord 2, 14 Pad, 15 Phrase 1, 16 Phrase 2 — [Style Creation Tutorial (third-party, Scribd)](https://www.scribd.com/document/95069076/Style-Creation-Tutorial)
- Yamaha's descriptions of the parts:
  - Bass uses an instrument chosen to match the style
  - Chord 1/2 is "rhythmic chord backing, typically piano or guitar"
  - Pad is "sustained sounds such as strings, organ, and choir"
  - Phrase 1/2 is "punchy brass stabs, arpeggiated chords, and other extras that add interest"

  — [Yamaha Genos manual via manualshive (search snippet; the page was access-blocked when fetched)](https://manualshive.com/en/manual/yamaha/genos/897212?page=130)
- Valid style section names: Main A–D; Intro A–C; Ending A–C; Fill In AA, BB, CC, DD; Fill In BA (= Break) — [Style Creation Tutorial](https://www.scribd.com/document/95069076/Style-Creation-Tutorial)
- Tyros has four variations, A–D, and "each fill-in is specially programmed to match the selected main section". Entry-level PSR models have only Main A/B — [Yamaha Tyros manual (ManualsLib)](https://www.manualslib.com/manual/196986/Yamaha-Tyros.html?page=34); [YamahaMusicians forum](https://yamahamusicians.com/forum/threads/style-fill-in.13651/)
- **One Touch Setting (OTS)**: each style has four. Pressing one recalls the voices and effects that best match the style and also turns on ACMP and SYNC START — [Yamaha Genos Owner's Manual (ManualsLib)](https://www.manualslib.com/manual/1309559/Yamaha-Genos.html?page=47)
- Korg Pa5X style elements: 3 intros, 4 variations, 4 fills, 1 break, 3 endings. A style can be linked to a Keyboard Set, Korg's equivalent of OTS — [Korg Pa5X specifications](https://www.korg.com/de/products/synthesizers/pa5x/specifications.php)
- Korg style tracks (earlier Pa models): DRUM and PERC for drum and percussion sequences, BASS for bass, and ACC1–ACC5 for accompaniment sequences — [Korg Pa1X manual](https://www.manualslib.com/manual/1146916/Korg-Pa1x.html?page=106)
- Korg: after a Fill, a Variation may already be recalled automatically, so the user doesn't need to pick one during the Fill — [Korg Pa3XLe manual](https://www.manualslib.com/manual/855081/Korg-Pa3xle.html?page=61). Intro/Fill/Break/Ending are named after the song section they serve — [Korg Pa4X manual](https://www.manualslib.com/manual/973941/Korg-Pa4x.html?page=64)

### Inferences
- The arranger vocabulary maps closely onto Airfret's role list: Rhythm = drums/percussion, Bass = bass, Chord = rhythmic chords, Pad = sustained harmony, Phrase = countermelody/fills. It supports a fixed role list with conventional defaults rather than free-form roles.
- "Main A–D" works as a single intensity/density dial for the whole band, and the fill is the transition between steps. One control, ordered A→D, keeps the UI simple.
- OTS is a precedent for a "one tap gives you a sensible whole-band setup" preset.

### Gaps
- I found no authoritative source for what Rhythm 1 vs Rhythm 2 conventionally play beyond the channel names (Sub vs Main).
- Roland arranger keyboards (E-A7, BK series) were not researched. Their part names are unverified.
- Which parts each Yamaha OTS turns on or off is in the Data List, which was not retrieved.

## Apple GarageBand Drummer and Logic Pro Session Players

### Takeaway
Apple's model is the strongest precedent for "simple by default, depth on demand":
- choose a **style/player** and a **preset**
- place one point on an XY pad: **simple ↔ complex** (horizontal), **soft ↔ loud** (vertical)
- add a few knobs (Fills, Swing)
- then optional "Details" and a manual grid

Players follow the chord track and can lock to another track's rhythm. Section-aware variation comes from the Arrangement track (Intro/Verse/Chorus/Bridge/End). Every region on the timeline carries its own settings.

### Cited Findings
- GarageBand Drummer XY pad: drag the puck up or down for louder or softer, left or right for simpler or more complex — [Apple GarageBand for iPhone guide](https://support.apple.com/guide/garageband-iphone/chs9692b2133/ios)
- The Fills knob sets the number and length of fills. The Swing knob sets the shuffle feel — [Apple GarageBand for Mac help 10.1.5](https://help.apple.com/garageband/mac/10.1.5/en.lproj/gbnd0fd51168.html)
- Drummer "Follow": locks kick and snare to the rhythm of another track, usually bass or rhythm guitar — [Violet Recording guide](https://violetrecording.com/how-to-use-drummer-in-garageband/); [Macworld](https://www.macworld.com/article/668248/using-drummer-in-garageband-for-mac.html)
- Logic Pro Drummer:
  - default style is Pop Rock
  - a preset window shows rhythmic variations within the style
  - Complexity and Intensity are adjustable
  - kit-piece icons switch elements on or off, and kick/snare can take a separate variation from the rest of the kit
  - knobs: **Fill Amount, Fill Complexity, Swing**
  - **Details**: ghost notes, added percussion, double/half time, Humanize, Feel (push/pull)
  - a **Manual** tab gives a grid for kick and snare

  — [Sound on Sound, "Logic Pro Session Players"](https://www.soundonsound.com/techniques/logic-pro-session-players)
- Logic Pro Bass Player: styles Rock, Songwriter, Alternative and R&B, with sub-styles and presets. Finger, pick or slap technique. Articulations are **chosen automatically by default**, and harmonics, damped notes and slides can be set by hand — [Sound on Sound](https://www.soundonsound.com/techniques/logic-pro-session-players)
- Logic Pro Keyboard Player:
  - playing styles **Freely, Broken, Block, Arpeggiated, Pad**, with "Freely" the most accompanist-like
  - **left and right hand can each be switched off**
  - right-hand **voicing type** and **movement amount** controls
  - Complexity, Intensity, Fill, Fill Complexity and Swing as on Drummer
  - Details: grace notes, Feel, Dynamics, Humanize

  — [Sound on Sound](https://www.soundonsound.com/techniques/logic-pro-session-players)
- All Session Players:
  - tempo Halve, Double or Auto
  - the rhythm source defaults to **Follow Chord Rhythm** and can be set to another track, usually the Drummer
  - a region can carry its own chords ("Follow Region Chords")
  - the **Arrangement track** sections (Intro, Verse, Chorus, Bridge, End, or custom) vary the parts automatically per section, and this can be turned off
  - **Convert to MIDI Region** allows note-level fixes

  — [Sound on Sound](https://www.soundonsound.com/techniques/logic-pro-session-players)
- Praise: a consistent interface across Drummer, Bass and Keyboard, and "capable backing parts" — [Sound on Sound](https://www.soundonsound.com/techniques/logic-pro-session-players). The players form a backing band that takes harmonic cues from the chord track, follows tempo and can match another track's rhythm — [Macworld Logic Pro 11 review](https://www.macworld.com/article/2334703/logic-pro-for-mac-11-review.html)
- Complaints:
  - no automatic chord extraction from a played MIDI part
  - bass and keys may not lock tightly to unusual drum timing
  - slow, chill-out and world styles are underserved
  - occasional odd note choices

  — [Sound on Sound](https://www.soundonsound.com/techniques/logic-pro-session-players). The players don't follow your live playing — [MusicRadar review](https://www.musicradar.com/reviews/apple-logic-pro-11-logic-pro-for-ipad-2-review)
- Sound on Sound describes Complexity and Intensity as sliders in Logic's Session Players, while GarageBand presents the same two dimensions as one XY puck — [Sound on Sound](https://www.soundonsound.com/techniques/logic-pro-session-players) vs [Apple GarageBand iPhone guide](https://support.apple.com/guide/garageband-iphone/chs9692b2133/ios). A forum post says the XY pad was most easily reached in GarageBand ≤10.3 — [AppleVis](https://applevis.com/comment/46555)

### Inferences
- Two continuous dimensions (complexity, loudness), shared by every instrument, make a compact, learnable per-instrument control. Fills and swing are secondary knobs, and "Details" sit behind a disclosure.
- Keyboard Player's playing-style list (Freely/Broken/Block/Arpeggiated/Pad) is a ready vocabulary for a "pattern" picker on chordal instruments. Turning hands off maps to "bass only / chords only" roles.
- "Follow" (lock rhythm to another part) is a precedent for an instrument doubling or answering another, for example a countermelody following the melody's rhythm or heterophony.

### Gaps
- Apple's own Logic Pro guide pages ("Edit a Bass Player performance", "Choose Session Player presets", "Follow rhythm of chords and other tracks") returned only a table of contents when fetched. Exact control ranges and defaults are therefore taken from Sound on Sound, not Apple.
- The Synth Player additions in later Logic versions and any 2025–2026 changes were not verified.

## Other precedents: iReal Pro, Hookpad, Sibelius Arrange, and others

### Takeaway
**iReal Pro** is the minimal end of the range: one **style** per song, plus a Mixer with per-instrument sound, volume (slider fully left = mute), reverb and an "Embellished Chords" toggle. **Hookpad** has a similar "swap instrument/rhythm/style and the arrangement regenerates" model, with a Mix panel for per-instrument range and volume. **Sibelius Arrange** (notation) uses named "arrange styles" plus Explode and Reduce to spread or condense parts. Its official style list was not retrieved.

### Cited Findings
- iReal Pro Mixer:
  - tap an instrument's name to change its sound, and every sound is available in every style
  - **Default Instruments** restores the style's instruments
  - each instrument has a volume slider, and fully left mutes it
  - one reverb slider
  - **Embellished Chords** off plays exact chord symbols, on adds extensions

  — [iReal Pro: Customize your backing tracks](https://www.irealpro.com/learn/customize-your-backing-tracks)
- iReal Pro has 50 styles across Jazz, Latin and Pop, with Blues, Brazilian and Salsa packs as in-app purchases — [iReal Pro: Customize your backing tracks](https://www.irealpro.com/learn/customize-your-backing-tracks)
- iReal Pro's four plain swing styles are one style with four sets of patterns, chosen by tempo. Some jazz styles play two feels and switch between them automatically — [iReal Pro: Accompaniment styles](https://www.irealpro.com/learn/accompaniment-styles); [iReal Pro: Backing track styles](https://www.irealpro.com/learn/backing-track-styles)
- iReal Pro use cases: mute the piano to practise comping, or mute the bass to practise walking lines — [iReal Pro learn pages (search summary)](https://www.irealpro.com/learn/customize-your-backing-tracks)
- iReal Pro complaint: one user objected to limiting mixer instruments by style and wanted the full list available regardless of style — [iReal forums](https://irealb.com/forums/showthread.php?p=39731). The current docs say every sound is now available in every style — [iReal Pro](https://www.irealpro.com/learn/customize-your-backing-tracks)
- Hookpad: "When you swap an instrument, rhythm, or style, Hookpad magically creates a professional arrangement". A **Mix** button exposes each instrument's range and volume. MIDI export writes one track per instrument — [Hooktheory Hookpad](https://www.hooktheory.com/hookpad); [Hooktheory blog](https://www.hooktheory.com/blog/)
- Hookpad voices the same harmony differently depending on the chosen instrument — [Hooktheory forum](https://forum.hooktheory.com/t/more-details-on-harmonization/3960)
- Sibelius: **Explode** turns piano sketches into full orchestrations, and **Reduce** condenses ensembles into a playable piano score — [Avid Sibelius music arranging](https://www.avid.com/sibelius/music-arranging). Arrange was introduced in Sibelius 2 (2002) as an "AI" auto-orchestration that could arrange a piano piece for concert band — [MacTech 2002](https://www.mactech.com/2002/03/13/revolutionary-new-iso-8859-1qsibeliusae-2-music-notation-software/)
- The Sibelius reference has separate chapters "Arrange" and "Edit Arrange Styles", so styles are user-editable — [Sibelius 7.1 Reference (Scribd)](https://www.scribd.com/document/357430699/sibelius710-reference-en-pdf). Users mention jazz and "Nestico" arrange styles and note that range presets can put a style in the wrong octave — [Writing for Sax (Scribd)](https://www.scribd.com/doc/256685926/Writing-for-Sax)
- Explode reportedly fails on a mix of chords and voices (Steinberg forum user) — [Steinberg forums](https://forums.steinberg.net/t/explode-music-function/133421)

### Inferences
- iReal Pro's success with one style and a mixer shows that, for practice use, "choose band style + per-instrument volume/mute" covers most needs. Muting one part so you can play it yourself is a key use case, and it fits Airfret, where the user plays one of the parts.
- Hookpad's "change instrument → arrangement regenerates in that instrument's idiom" supports making the role-to-pattern default instrument-aware rather than asking the user to set both.

### Gaps
- The official Sibelius arrange-style names (for example "Standard" or "Wind/Brass" ensembles) were not verified.
- Scaler, BandLab, Soundtrap, Chordify, MuseScore and Dorico auto-arranging were not researched within the tool budget. I have no cited findings for them.

## Progressive disclosure, whole-band presets, and section control

### Takeaway
Across the products the common pattern has four layers:
1. one **whole-band style or preset** sets everything (BiaB style, arranger style + OTS, iReal style, Logic style/preset)
2. per-instrument **on/off + level** is always visible (arranger part on/off, iReal mixer, BiaB mute/solo/volume)
3. per-instrument **character** comes from one or two continuous controls (Apple's complexity/loudness) or a short ordered list (BiaB Simpler/Held, Main A–D)
4. **advanced details** sit behind a disclosure (Apple "Details" and "Manual" tabs, BiaB dialogs)

Sections are controlled either by a fixed section vocabulary (Intro/Main/Fill/Break/Ending; a/b substyles) or by labelling the song's form (Logic's Arrangement track) so that parts vary on their own.

### Cited Findings
- Logic's Arrangement-track markers (Intro, Verse, Chorus, Bridge, End) make Session Players vary per section automatically, and this can be switched off — [Sound on Sound](https://www.soundonsound.com/techniques/logic-pro-session-players)
- BiaB's "b" substyle conventionally serves the chorus or bridge — [PG Music 2019 manual](https://www.pgmusic.com/manuals/bbm2019full/chapter13.htm)
- Arranger fills match the current main section and lead into the next — [Yamaha Tyros manual](https://www.manualslib.com/manual/196986/Yamaha-Tyros.html?page=34); [Korg Pa3XLe](https://www.manualslib.com/manual/855081/Korg-Pa3xle.html?page=61)
- One-tap whole-setup presets: Yamaha OTS, four per style — [Genos manual](https://www.manualslib.com/manual/1309559/Yamaha-Genos.html?page=47); Korg Keyboard Set linked to a style — [Korg Pa5X specs](https://www.korg.com/de/products/synthesizers/pa5x/specifications.php); iReal "Default Instruments" reset — [iReal Pro](https://www.irealpro.com/learn/customize-your-backing-tracks)
- Defaults chosen automatically, with manual override as an option: Logic Bass Player articulations default to automatic — [Sound on Sound](https://www.soundonsound.com/techniques/logic-pro-session-players). BiaB substitutes RealTracks by tempo by default — [PG Music 2026](https://www.pgmusic.com/manuals/bbw2026full/chapter7.htm)
- Density is the cause of the complaints: BiaB's exposed depth is the most-cited complaint — [Synth and Software](https://synthandsoftware.com/2021/11/band-in-a-box-2021-the-synth-and-software-review/). Apple's consistent per-player interface is praised — [Sound on Sound](https://www.soundonsound.com/techniques/logic-pro-session-players)

### Inferences
- A layered design, mapped onto these precedents:
  - **Band texture preset** (for example Full band / Quiet / Folk unison), analogous to style + OTS
  - **per-instrument row**: role chip (Melody · Countermelody · Chords · Bass · Rhythm · Pad · Off), level slider, mute/solo
  - **"More" disclosure** per row: pattern style (Logic Keyboard Player-like: Block / Broken / Arpeggiated / Held / Free), busyness (simple ↔ complex, like Apple's horizontal axis or BiaB's Simpler/Held), fills on/off
  - **when it plays**: per-section toggles or "enters at section X", modelled on arranger part on/off per Main variation and Logic's Arrangement-track variation
- A "Folk ensemble/heterophony" preset has no direct commercial precedent in the sources found. The nearest mechanisms are Drummer/Session Player "Follow" (one part locking to another's rhythm) and BiaB's stacking of several RealTracks on one track.
- Keep the same control set on every instrument, as Apple does, because consistency is the praised trait.

### Gaps
- I found no sources with user-research data (usage statistics, or which controls users actually change) for any product.
- I found no precedent for a named "heterophony" texture preset.
- BandLab and Soundtrap section/arrangement controls were not researched.
