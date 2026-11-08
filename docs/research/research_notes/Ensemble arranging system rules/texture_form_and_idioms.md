# Texture across form, and idiomatic accompaniment patterns per instrument family

Scope: notes for a rule-based arranging engine. Any set of instruments plays a song's melody with bass and chords. Part A covers how texture changes across a piece. Part B covers the concrete accompaniment idioms of each instrument family, plus countermelody rules.

Every cited finding has an inline source. Inferences are my own engineering readings of those findings, or standard practice I could not cite in this pass, and are labelled as such. Source quality varies. Owsinski, Sound On Sound, Berklee and LibreTexts (Hutchinson) are the strongest. Blogs, Scribd handouts and lesson sites are weaker, and are flagged where it matters.

---

## (A1) How many layers sound at once, and what counts as a layer

### Takeaway
Producers agree on a ceiling of about **4 simultaneous "elements"** (3 often better, 5 rare; Sound On Sound allows 5 with drums counted as one). An element is a *rhythmic/functional idea*, not a track. Unison or octave doublings and parallel harmonies count as one element.

### Cited Findings
- "Usually no more than four elements should play at once"; three can work well; five rarely works — [Bobby Owsinski, Arrangement rules](https://bobbyowsinskiblog.com/arrangement-rules/)
- An element is a group of instruments playing the same rhythm. A doubled guitar or vocal is one element, and so is a lead vocal plus two harmonies. Two guitars playing different parts are two elements — [Owsinski](https://bobbyowsinskiblog.com/arrangement-rules/)
- Give each instrument its own frequency range. Two instruments playing the same notes in the same octave at similar volume compete. Fix it by changing timbre, moving one part to another octave, or having them play at different times — [Owsinski](https://bobbyowsinskiblog.com/arrangement-rules/)
- "Five elements at one time — counting the drums as one — is generally the most you'll hear", occasionally six. With many parts, keep each one simple and let their interaction create the complexity. Doubling (unison/octave, different timbre) adds texture, but only when it has a purpose — [Sound On Sound, Arranging pop](https://www.soundonsound.com/techniques/arranging-pop)
- The "rule of three" (the brain can follow about three elements) is a widely repeated rule of thumb, not a measured standard. An element may span several tracks — [Substack, Rule of Three](https://n1ghtmar3cat.substack.com/p/less-is-more-using-the-rule-of-three?r=11vles); ProSoundWeb puts the confusion point at more than 5 — [ProSoundWeb](https://www.prosoundweb.com/in-the-studio-considering-song-arrangement-elements/)
- Sometimes removing an element creates more impact than adding one. Mute non-essential layers, and leave them out if the song improves — [ProSoundWeb](https://www.prosoundweb.com/in-the-studio-considering-song-arrangement-elements/)
- Marching/pep band guidance: think of the ensemble as **four voices: Melody, Harmony, Bass, Percussion**. Give every section at least one doubling partner — [ArrangeMe, Arranging for Marching & Pep Bands](https://blog.arrangeme.com/blog/arranging-for-marching-and-pep-bands)
- Typical high-school band "block" scoring: trumpets doubled by clarinets, flutes, saxes and horns in unison/octaves. The "full" system for advanced bands adds a separate countermelody (flute, clarinet, horn) — [Scribd handout, Athletic Bands](https://www.scribd.com/document/468918359/Athletic-Bands-pdf) (low-authority)

### Inferences
- Engine model: assign every instrument to one **role**: `melody`, `counter`, `pad` (sustained harmony), `rhythm` (comping or ostinato harmony), `bass`, `percussion`. The "element count" is the number of *distinct active roles*, not the number of instruments. Cap active roles at 4 (configurable 3–5). Extra instruments *double* an existing role (unison or octave) instead of opening a new one.
- Register lanes keep roles apart. Bass below about C3. Pad/rhythm in the C3–C5 band, kept out of the melody's octave or below it. Melody on top or clearly separated. A counter-line sits in a different octave from the melody, or in its rhythmic gaps.
- Doublings: octave doublings of the melody (glockenspiel, piccolo, a second violin) count as the same element, so they are the cheap way to make a section "bigger" without clutter.

### Gaps
- No academic study gives a hard number. 3–5 is practitioner consensus.

---

## (A2) Planning texture across sections and repetitions

### Takeaway
Texture is the main lever for form. Thin verses, fuller choruses, layers added on each repeat (the "orchestral crescendo" à la Boléro), a contrast or thinner trio/bridge, a strip-back before the last big chorus, and a planned ending, never a default fade.

### Cited Findings
- **Intro**: fade an instrumental part in from silence so the song gains strength gradually; keep atmospheric intros short; or open straight on a catchy riff or a big simple chorus — [Sound On Sound](https://www.soundonsound.com/techniques/arranging-pop)
- **Endings**: decide the ending in advance. Options: stop dead, end on an unaccompanied vocal phrase, remove instruments one at a time, or strip back and rebuild to a big finish — [Sound On Sound](https://www.soundonsound.com/techniques/arranging-pop)
- **Repeated choruses**: vary them with new chords under the familiar melody, a detour, or by making the first half instrumental with the voice returning for the final lines. Repeat a hook 2–3 times for continuity, balanced with new material — [Sound On Sound](https://www.soundonsound.com/techniques/arranging-pop)
- **String register as a build**: in a chorus, start the string parts low and move them upward toward a powerful ending. A single high sustained string note adds energy behind a chorus — [Sound On Sound](https://www.soundonsound.com/techniques/arranging-pop)
- **Fills between phrases**: leave space for the lead. Instrumental fills work best *between* phrases, and backing parts should avoid the lead's register — [Sound On Sound](https://www.soundonsound.com/techniques/arranging-pop)
- **Boléro (orchestral crescendo by layering)**: one melody repeated (about 18 times), each repeat changing orchestration, timbre and dynamics. It begins with solo instruments on the melody (flute, clarinet, bassoon, E♭ clarinet, oboe d'amore, then trumpet with flute) and progresses to groups. The snare ostinato is constant. Instruments that have had their melodic turn often join the accompaniment afterwards. Ravel described the only variation as "orchestral crescendo" — [Wikiwand, Boléro](https://wikiwand.com/en/articles/Bolero_(Ravel)); [Pacific Symphony blog](https://pacificsymphony.blog/2017/12/19/listen-to-this-bolero/); [The Conversation](https://www.theconversation.com/decoding-the-music-masterpieces-ravels-bolero-a-sinuous-and-sexy-composition-with-no-music-in-it-149528) (secondary sources; the exact order should be checked against a score)
- **March form / trio**: the trio is the contrasting section, usually in a *lighter texture*, and in major it typically modulates to the subdominant — [Wikipedia, Trio (music)](https://en.wikipedia.org/wiki/Trio_(music)). Sousa-era layout: intro, AA, BB, Trio (often repeated with a "breakstrain"); recapitulating the first strain after the trio is not universal — [UHS Band, March form](https://uhsband.com/musichistory/romantic/marchform.php); [Scribd march form handout](https://www.scribd.com/document/443048015/march-form-handout-pdf)
- Pep band: "Hit the best parts of the song and end your arrangement in under three minutes" — [ArrangeMe](https://blog.arrangeme.com/blog/arranging-for-marching-and-pep-bands)
- The identity of the main parts can change across a song to keep interest, and reducing clutter makes the production seem more varied — [UAL Sound Centre blog](https://soundcentre.myblog.arts.ac.uk/?p=219) (student blog)
- Pads can start without vibrato and add it gradually toward the climax, and small hairpins shape a static line — [Berklee, Writing String Pads](https://www.berklee.edu/node/2436901)

### Inferences (engine rules, built from the above)
- **Section energy curve.** Give every section an energy level 1–5 and map it to texture:
  - E1 (intro/outro): 1–2 roles, e.g. a solo pad or arpeggio, or melody alone; or the intro plays the last 2–4 bars of the tune over the chords.
  - E2 (verse 1): melody + bass + one light harmony role (sustained or sparse comping), half-time or longer note values.
  - E3 (verse 2 / pre-chorus): add a rhythm role or busier subdivision (quarters to 8ths).
  - E4 (chorus): melody (plus octave doubling) + bass + rhythm + pad, with a counter-line allowed only in melody gaps.
  - E5 (final chorus): tutti, with all instruments doubling into the 4 roles; widen the register (bass down an octave, glock/high strings an octave up).
- **Repeat handling** (strophic songs, the common case for a melody file): verse n gets energy `min(5, base + n − 1)`. Rotate the melody to a different instrument on each repeat (Boléro principle). The previous melody instrument moves to `counter` or `pad` instead of dropping out.
- **Thin before the climax.** Put the bar(s) before the last chorus, or the whole penultimate section, one or two levels *below* the previous section (drop bass/drums or leave just pad + melody), then jump to E5. This "strip back and rebuild" comes straight from Sound On Sound's ending options, applied to the climax.
- **Tutti vs soli.** Soli = one family or one instrument carries the melody with minimal support (E1–E2). Tutti = all on the melody or in 4 roles (E5). Alternate them phrase by phrase for call-and-response: phrase A soli (e.g. woodwinds), answering phrase B tutti or another family (brass). The trio of a march = soli or lighter texture, then a final tutti "grandioso" restatement.
- **Endings**: (a) final chord held by all (fermata) after a ritardando; (b) "button": a short tutti hit on beat 1 after the last melody note; (c) subtractive: instruments drop out in reverse order of entry, ending on the instrument that started. Pick by style: march = (b), ballad = (a) or (c).

### Gaps
- No source found gives quantitative rules for *how many bars* an intro or "thinning" should last. The 2–4 bar intro and 1–2 bar strip-back are conventional, not cited.
- I found no authoritative, citable source on passing the melody among sections in concert band beyond Boléro and marketing copy.

---

## (B1) Keyboard / piano accompaniment patterns

### Takeaway
There is a small, codable set: block chords (quarters, repeated 8ths, the "1 (2) &" pop rhythm), arpeggios (rising, falling, rise-and-fall over an octave bass), Alberti (low–high–mid–high), and stride/oom-pah (bass on the strong beats, chord on the weak ones).

### Cited Findings
- Texture has two axes: vertical (how many notes or voices sound at once) and horizontal (rhythmic activity, i.e. the most common note value) — [LibreTexts, Hutchinson ch. 14 Texture](https://human.libretexts.org/Bookshelves/Music/Music_Theory/Music_Theory_for_the_21st-Century_Classroom_(Hutchinson)/14%3A_Accompanimental_Textures)
- **Arpeggios**: in one part, over an octave bass in a lower part (Moonlight Sonata). They can descend, or ascend and descend through the chord. The bass and soprano are often a tenth apart. 16ths appear in 4/4 pop examples — [LibreTexts 14.3 Arpeggiated Accompaniments](https://human.libretexts.org/Bookshelves/Music/Music_Theory/Music_Theory_for_the_21st-Century_Classroom_(Hutchinson)/14%3A_Accompanimental_Textures/14.03%3A_Arpeggiated_Accompaniments)
- **Alberti bass**: "low–high–middle–high" order of chord tones (model: Mozart K. 545, I) — [LibreTexts 14.3](https://human.libretexts.org/Bookshelves/Music/Music_Theory/Music_Theory_for_the_21st-Century_Classroom_(Hutchinson)/14%3A_Accompanimental_Textures/14.03%3A_Arpeggiated_Accompaniments)
- **Block chords**, four stock rhythms — [LibreTexts 14.4 Block Chord Accompaniments](https://human.libretexts.org/Bookshelves/Music/Music_Theory/Music_Theory_for_the_21st-Century_Classroom_(Hutchinson)/14%3A_Accompanimental_Textures/14.04%3A_Block_Chord_Accompaniments):
  - "1 (2) &": chord on beat 1 and on the "&" of beat 2 (Let's Get It On, Thinking Out Loud, See You Again)
  - "Barbara Ann" rhythm: `1 2 3 (4) & (1) & (2) & 3` (Barbara Ann, You Can't Hurry Love, Walking On Sunshine), sometimes in the bass only
  - repeated 8th-note chords (Mozart K. 310, Schubert "Gute Nacht", rock, "We Are Young")
  - repeated quarter-note chords (Ombra mai fu, Roxanne, Love Song)
- **Afterbeats**: repeated chords (usually 8ths, sometimes quarters) after the downbeat (Schoenberg's term). **Offbeats**: chords regularly on the upbeats, avoiding downbeats (polka, reggae guitar) — [LibreTexts 14.5 Afterbeats and Offbeats](https://human.libretexts.org/Bookshelves/Music/Music_Theory/Music_Theory_for_the_21st-Century_Classroom_(Hutchinson)/14%3A_Accompanimental_Textures/14.05%3A_Afterbeats_and_Offbeats)
- **Stride**: left hand plays a single bass note, octave or tenth on beats 1 and 3, and a chord on beats 2 and 4. The bass is usually the root, sometimes the fifth or octave. Ragtime after-chords are triads; Harlem stride often uses 4-note chords — [MasterClass, Stride piano guide](https://www.masterclass.com/articles/stride-piano-guide); [The Jazz Piano Site, Stride](https://www.thejazzpianosite.com/?p=3670)

### Inferences (codable patterns; beat = quarter in 4/4)
- `block-quarters`: close-position triad in C4–C5, struck on every beat. `block-8ths`: same, on every 8th. `pop-1-2and`: hits at 0 and 1.5 beats, held.
- `arp-up-8ths` in 4/4: R-5-8-10 (root, fifth, octave, tenth) as 8ths, repeated, bass root held or doubled an octave below. `arp-up-down`: R-5-8-10-8-5-R-5 (8 eighths).
- `alberti-16ths` in 4/4: per beat, low(R) – high(5th or 8ve) – mid(3rd) – high, in the C3–C5 range. For triad C-E-G that is C-G-E-G.
- `stride` / `oom-pah` (4/4): beat 1 root (C2–C3), beat 2 chord (C3–C4), beat 3 fifth or root, beat 4 chord. In 2/4: beat 1 bass, beat 2 chord (a march oom-pah). In 3/4 (waltz): beat 1 bass, beats 2 and 3 chord ("oom-pah-pah").
- Choose the pattern by energy: E1–2 sustained whole-note chord or slow arpeggio; E3 broken chords or Alberti; E4–5 block 8ths or stride.

### Gaps
- LibreTexts gives the rhythms but not the register or voicing details (those are in its score images). The registers above are standard practice, not cited.

---

## (B2) Guitar (acoustic strumming, fingerpicking; electric)

### Takeaway
Strumming: down strokes on beats, up strokes on the "&"s; omitting some strokes gives the stock patterns. Folk backup splits each bar into bass-note and strum (4/4: bass 1 and 3, strum 2 and 4; 3/4: bass 1, strum 2 and 3). Travis picking: the thumb alternates bass on every quarter while the fingers fill above.

### Cited Findings
- 3/4 strumming is the same idea as 4/4: down on the numbers (1 2 3), up on the "&"s. Up strokes are lighter than down strokes. 6/8 = two big beats of three eighths each, accent on the first of each group; a 6/8 song can be backed by playing the 3/4 pattern twice per bar — [Wikibooks, Simple three-quarter beat](https://en.wikibooks.org/wiki/Guitar/Simple_three-quarter_beat); [JustinGuitar community, 6/8 pattern](https://community.justinguitar.com/t/a-6-8-strumming-pattern/2390)
- Celtic/folk backup — [Celtic Guitar Music, Backup styles](https://celticguitarmusic.com/tb_backup_styles.htm):
  - Reel (4/4): bass on 1 and 3, strum on 2 and 4. Alternate the bass strings each bar (for G: 6th string, strum, 4th string, strum). Treble strums use only the top three strings. Down-up variant: downs on the beats, ups on the "+"s.
  - Waltz (3/4): bass on 1, then two strums.
  - Jig (6/8): down-up strumming accented on counts 1 and 4.
- Travis picking: the thumb plays every quarter note and alternates between two bass strings (e.g. A and D strings on C), with melody or chord notes from the fingers in between — [12fret, From beginner fingerpicking to Travis picking](https://archive.12fret.com/news-and-reviews/moving-from-beginner-fingerpicking-techniques-to-travis-picking/); [Guitar World, Travis picking](https://www.guitarworld.com/lessons/how-fingerpick-merle-travis)
- Reggae: offbeat chords, often on electric guitar — [LibreTexts 14.5](https://human.libretexts.org/Bookshelves/Music/Music_Theory/Music_Theory_for_the_21st-Century_Classroom_(Hutchinson)/14%3A_Accompanimental_Textures/14.05%3A_Afterbeats_and_Offbeats)

### Inferences (codable; D = down, U = up, - = rest; grid = 8ths)
- 4/4 strums: `D-D-D-D-` (quarters, E2); `DUDUDUDU` (E4); stock pop `D-DU-UDU` = D on 1, D on 2, U on &2, U on &3, D on 4, U on &4 (the well-known "down down-up up-down-up"; I could not cite it in this pass); folk `bass-strum-bass-strum`.
- 3/4: `D-DUDU` or `bass, strum, strum`. 6/8 (8th grid): `D-UD-U`, or `D U U D U U` with accents on 1 and 4.
- Fingerpicking in 4/4 8ths, p = thumb, chord tones T1–T3 on the top strings: Travis `p(R) T3 p(5) T2 p(R) T3 p(5) T2`; arpeggio `p(R) i m a m i ...`. 3/4: `p i m a m i` (6 eighths). 6/8: `p i m a m i`, accented p on 1 and a lighter p or the fifth on 4.
- Voicing: guitar chords are 4–6 notes spread over E2–E5, root on the lowest string; the strum spreads the notes about 10–30 ms apart (down = low to high, up = high to low, ups using only the top 3–4 strings and played softer).
- Electric idioms (standard practice, not found in my sources): power chord = root + 5th (+ octave) in E2–E3, palm-muted 8ths on the root for driving verses, open sustained power chords for choruses; sparse comping = short chord stabs on 2 and 4 or the offbeats (reggae/ska "skank" on every "&").

### Gaps
- The down-down-up-up-down-up pattern, palm-muted 8ths and power-chord conventions are not cited above. The searches did not return authoritative pages for them, though they are uncontroversial pedagogy.

---

## (B3) Bass lines

### Takeaway
Root on the downbeat, a chord tone (5th) on the secondary strong beat, and an approach note (a half step or scale step from the next root) on the last beat before a chord change. Walking bass is 4 quarters per bar following that rule. Marching/band bass carries the real bass line, doubled at the octave by baritones/trombones.

### Cited Findings
- Walking bass (4/4): root on beat 1; 3rd or 5th on beat 2; 5th or 7th on beat 3; beat 4 = approach note a half step above or below the next chord's root (diatonic step and dominant/5th approaches also common). Beats 1 and 3 are the harmonically important ones — [Fundamental Changes, Walking basslines](https://www.fundamental-changes.com/walking-basslines-on-guitar/); [Free Jazz Lessons](https://www.freejazzlessons.com/?p=53401); [The Jazz Piano Site, Walking bass-lines](https://www.thejazzpianosite.com/?p=483)
- Tubas carry the bass line, including the original bassist's riffs, not just roots; add baritones and trombones an octave above the tubas. Repeated quarter notes beat long whole notes for drive and breathing — [ArrangeMe](https://blog.arrangeme.com/blog/arranging-for-marching-and-pep-bands)
- The "Barbara Ann" rhythm is often used in the bass alone — [LibreTexts 14.4](https://human.libretexts.org/Bookshelves/Music/Music_Theory/Music_Theory_for_the_21st-Century_Classroom_(Hutchinson)/14%3A_Accompanimental_Textures/14.04%3A_Block_Chord_Accompaniments)

### Inferences (codable)
- `bass-whole`: root, held for the chord (E1). `bass-root-fifth` 4/4: R on 1, 5 on 3 (half notes); 2/4 march: R on 1, 5 (below) on 1 of the next bar (tuba "oom"). 3/4: R on 1 only, or R(1) and 5 on the next bar's 1.
- `bass-8ths`: driving root 8ths (rock, E4). `bass-octave`: R(low) R(+8va) alternating 8ths (disco/dance).
- `bass-walk`: [R, chordTone, chordTone, approach(nextRoot ± 1 semitone)]. Choose the approach direction to minimise leaps; when the chord lasts 2 bars, put the approach only before the change.
- Range: electric bass E1–G3 (sounding), tuba about D1–F3; keep the bass ≥ an octave below the harmony's lowest note.

### Gaps
- No source here confirms the "tuba root–fifth in marches" convention specifically; the search found none. It is standard band practice (pairs with afterbeats), but uncited.

---

## (B4) Sustained pads (strings, organ, brass choir)

### Takeaway
Pads are long sustained chords ("goose eggs") that state the harmony without competing. Voice-lead them: keep common tones, move the other voices to the nearest chord tone, keep the same number of voices on every chord, put the root in the bass, and keep close voicings in the middle register so the melody stands out.

### Cited Findings
- Pads are long sustained notes ("goose eggs") that present harmony without interfering with rhythm or melody. Stagger bow changes so the sound never breaks — [Berklee, Writing String Pads](https://www.berklee.edu/node/2436901)
- Voicing: close (within an octave) lets the melody stand out; wide (> a tenth between cello and violin 1) broadens. The bass always sounds the root. Keep tensions above the G below middle C (G3); the third can go as low as E3; the octave around middle C is neutral. High violin pads can pull focus from the melody — [Berklee](https://www.berklee.edu/node/2436901)
- Smooth voice leading matters more than including every chord tone. With 2 accompanists use the guide tones (3rd and 7th). With 1 player write a chord-tone line that works as a melody. Upper voices may rise with the melody to reinforce it — [Berklee](https://www.berklee.edu/node/2436901)
- Make each chord contain the same number of notes as there are players — [MusicRadar, voice leading](https://www.musicradar.com/news/smoother-chord-progressions-voice-leading)
- Retain common tones between successive harmonies and avoid leaps — [Wikipedia, Voice leading](https://www.wikipedia.org/wiki/Voice_leading)
- Pads have little rhythmic activity, so in production they get movement from pulsing or arpeggiation — [Sound On Sound](https://www.soundonsound.com/techniques/arranging-pop)
- String counter-melodies should be melodies in their own right, not just restate the chords — [Sound On Sound](https://www.soundonsound.com/techniques/arranging-pop)

### Inferences (codable)
- Algorithm: for N pad voices, choose the first voicing close-position in E3–C5 with the root in the lowest pad voice (or leave the root to the bass instrument when one is present). For each next chord, take the minimal-total-semitone-movement assignment of voices to chord tones (keep common tones; never move a voice more than about a 4th); allow doubling of root or 5th, never the 3rd when it's the leading tone.
- Rhythm: one attack per chord change (whole notes or chord duration). At E4+, re-attack every half bar or pulse quarters for brass/organ. A brass pad = the same voicing, but louder dynamics at E4–5 only (brass at E1–2 reads as heavy).
- Keep the top pad voice at least a 3rd below the current melody note, or move the pad below it. Never cross the melody.

---

## (B5) Woodwind countermelodies and how to write them so they don't clash

### Takeaway
Rhythmic complementarity is the core rule: the counter-line moves when the melody holds and holds or rests when the melody moves. It should sit in its own register, favour contrary or oblique motion and steps, avoid parallel octaves and fifths with the melody, and fills go *between* melody phrases.

### Cited Findings
- Accompaniment should match the style of the melody and **move when the melody does not** — [Scribd handout via search summary, Athletic Bands](https://www.scribd.com/document/468918359/Athletic-Bands-pdf); same rule in a pop string handout — [Scribd, Ballad Pop String Tips](https://www.scribd.com/document/907656708/Ballad-Pop-String-Tips) (both low-authority, but consistent with SOS below)
- Instrumental fills work best between phrases, not competing with the singer; avoid backing parts in the same register as the lead — [Sound On Sound](https://www.soundonsound.com/techniques/arranging-pop)
- Contrary motion keeps lines independent; avoid parallel perfect intervals (5ths, 8ves); stepwise motion is smoothest; fill a leap by stepping back the other way; give the counter-line its own register above or below; contrast its rhythm — [Orphiq, Counterpoint for songwriters](https://orphiq.com/resources/counterpoint); [LANDR, Counterpoint](https://blog.landr.com/counterpoint); [Fiveable, Basic counterpoint](https://fiveable.me/fundamentals-of-music-theory/unit-13/basic-counterpoint/study-guide/Eb0J3Eas0mR6dccG)
- Strings (and by extension any section) can play melody, countermelody, fills between phrases, pads, or comping — [Berklee](https://www.berklee.edu/node/2436901)
- Band "full" scoring places a countermelody in flute, clarinet and horn while the trumpets carry the melody — [Scribd, Athletic Bands](https://www.scribd.com/document/468918359/Athletic-Bands-pdf)

### Inferences (codable algorithm)
1. Compute the melody's **activity map** per beat: onset density, and where notes are held (≥ 1 beat) or rests occur. Gaps = melody rests or holds ≥ 1 beat, especially phrase ends.
2. The counter-line gets *held tones* (a chord tone, 3rd or 7th preferred) under busy melody, and *moving notes* (stepwise 8ths or quarters, chord tones on beats, passing tones between) inside gaps; the "fill" variant is silent except in gaps.
3. Register: a 3rd–10th below the melody (alto-tenor) or an octave above for flute/piccolo; never cross the melody; avoid the same octave as the melody when it shares a timbre family.
4. Interval checks against the melody on every strong beat: consonant (3, 6, 8, 5); reject parallel 5ths and 8ves between consecutive strong-beat pairs; prefer contrary motion when the melody leaps.
5. Only one counter-line at a time (it uses one of the ~4 element slots); enable it at E3+ or on melody repeats.

---

## (B6) Brass hits, mallets, march band conventions

### Takeaway
Marches: melody in cornets/trumpets with woodwinds; horns (or alto saxes) play afterbeats; tuba/low brass play root-oriented bass on strong beats; the trio is lighter and in the subdominant, often with a counter-line, and the final strain is tutti. Glockenspiel doubles the melody, sounding two octaves above written. Brass hits are short tutti chord stabs on accents.

### Cited Findings
- Afterbeats are the conventional horn role in marches; one march is described as unusual because its horns play "no 'afterbeat' rhythms" — [The Band Post](https://thebandpost.com/?p=19280) (secondary; implied convention)
- Afterbeats = repeated chords after the downbeat; offbeats = chords on the upbeats (polka) — [LibreTexts 14.5](https://human.libretexts.org/Bookshelves/Music/Music_Theory/Music_Theory_for_the_21st-Century_Classroom_(Hutchinson)/14%3A_Accompanimental_Textures/14.05%3A_Afterbeats_and_Offbeats)
- Trio: lighter texture, subdominant key — [Wikipedia, Trio (music)](https://en.wikipedia.org/wiki/Trio_(music))
- Marching band roles: melody = piccolo, flute, clarinet, trumpet, mallets; harmony = alto/tenor sax, horn/mellophone, trombone; bass = bari sax, baritone, tuba; trombone melody for a darker colour; save trumpets' high notes — [ArrangeMe](https://blog.arrangeme.com/blog/arranging-for-marching-and-pep-bands)
- Glockenspiel sounds two octaves above written (treble clef with "15"); range about 2.5–3 octaves — [Wikipedia, Glockenspiel](https://en.wikipedia.org/wiki/Glockenspiel); [Indiana University keyboard percussion guide](https://isfee.music.indiana.edu/KeyboardPercussionGC)
- In concert band works, percussion is most often used for ostinato and rhythmic/dynamic reinforcement, and rarely for melody or counterpoint — [UConn dissertation, percussion in band symphonies 1950–1970](https://digitalcommons.lib.uconn.edu/dissertations/AAI8125451)

### Inferences (codable)
- `march-2/4` (or cut time): tuba R on beat 1, 5 on beat 2 (or R / 5 alternating per bar); horns/alto sax/2nd clarinets: afterbeat chord on each "&" (8th rest + 8th chord, the "oom-**pah**"), mid-register close triads (about G3–E5 concert); snare and bass drum on 1 (+2). 6/8 march: bass on 1 and 4, afterbeats on the 3rd and 6th eighths.
- Trio: transpose to IV, drop to E2–3 (melody in clarinets or low brass, soft afterbeats), then a final "grandioso" repeat at E5 with a piccolo obbligato / counter-line above.
- `brass-hits`: short (staccato 8th or quarter) close-voiced tutti chords on accented beats or melody phrase ends, or the "&" of 4 anticipating the next bar; use sparingly (≤ 1–2 per bar) at E4–5, in gaps of the melody.
- `glock-double`: melody played 1–2 octaves up, short decay; at E4+ only, or on the last chorus. `marimba-arp`: 8th-note broken chords (R-3-5-8) in C3–C6, often with rolls (tremolo) for sustained notes. `vibes-pad`: sustained chord tones with pedal.

### Gaps
- No primary arranging text (e.g. Sousa/Fillmore scoring study, Lang's or Erickson's band scoring books) was reachable in this pass. The tuba root–fifth pattern and horn afterbeats are well-established practice, but my citations for them are indirect.
- No citable source found for brass "hits/punches" conventions or marimba arpeggio idioms. The inferences above are standard practice and should be treated as unverified.
