# Orchestration roles and ensemble clarity: rules for a rule-based arranging engine

Scope: role/texture taxonomies, doubling, register and spacing, low interval limits, voice leading of inner parts, dynamic balance, and bass line versus accompaniment rhythm. Sources fetched: Rimsky-Korsakov, *Principles of Orchestration* (Gutenberg full text, Chapters I to III); Rubin's "Type I" orchestration notes (Univ. of Minnesota Duluth); Taming the Saxophone (jazz backings); Evan Rogers (big band pads); a "Sections, pads and other background figures" handout (scoredchanges.com); Sweetwater and Robin Hoffmann (low interval limits); assorted bass-line pages. I could not reach these pages: Open Music Theory (403), the UMN Open Textbook orchestration chapter (403), Sweetwater's full low-interval page (403) and the Yale marching band guidelines (404 after redirect). Adler, Piston, Blatter, Sebesky and Lowell/Pullig were not available online in citable form, so they are listed under Gaps rather than paraphrased from memory.

## 1. Role / texture taxonomies

### Takeaway
The texts agree on four or five functional layers: **primary melody**, **secondary melody / countermelody**, **harmonic support** (sustained pad or rhythmic chords), **bass**, and optionally **rhythmic support** or punctuation (stabs, riffs). Each layer should get its own instrument or group and a contrasting colour. An engine can treat these as a fixed `Role` vocabulary and assign each instrument exactly one role per section.

### Cited Findings
- Textural-function labels used in analysis courses: primary melody (PM), secondary melody (SM), parallel supporting melody (PSM, a melody doubled in thirds or sixths), static support (SS, pedal/sustained), harmonic support (HS), rhythmic support (RS) and harmonic-rhythmic support (HRS, chords that also carry rhythm). A secondary melody ranks below the primary but is still a melody. The primary melody is usually, but not always, the top voice. — [Music Theory Notes Ch 7–17 (academia.edu)](https://www.academia.edu/882388/Music_Theory_Notes_Ch_7_17)
- Harmony is described as the pitch layer that is neither melody nor bass and mainly completes the chords. Listeners hear the top line as the tune and the lower lines as backing. — [Parsing a texture, UEN Aural Skills](https://uen.pressbooks.pub/auralskills/chapter/parsing-a-texture/)
- Rubin's "Type I" orchestration: "each layer of activity is, in effect, portrayed by an instrument or instrumental group". The four voices are (1) primary melody, (2) secondary melodic voice, (3) accompaniment, (4) bass. A new section may set up a different hierarchy. — [Rubin, Techniques of Orchestration (UMN Duluth)](https://www.d.umn.edu/~jrubin1/JHR%20Orchestration%20I1.htm)
- Rimsky-Korsakov: the harmonic basis should differ from the melody "in colour as well as in fullness and intensity", so that the two stand apart. — [Rimsky-Korsakov, Principles of Orchestration (Gutenberg)](https://www.gutenberg.org/files/33900/33900-h/33900-h.htm)
- Jazz backing types: **pads** (sustained harmonised chords from the same or another section), **stabs/riffs/punches** (short figures) and **countermelody** (a subordinate melody, independent or imitative). — [Taming the Saxophone: Jazz Backings](https://tamingthesaxophone.com/theory/arranging/jazz-backings)
- Pads are "harmonised backing which can be rhythmic or consist mainly of long notes" and are "usually played by a whole section". A riff "is usually a short phrase that is repeated several times… usually a unison phrase but it can be harmonised". — [Sections, pads and other background figures (scoredchanges.com PDF)](https://www.scoredchanges.com/how-to/backings.pdf)
- Evan Rogers describes a pad as a sustained "bed" under the melody, with little rhythm, that fills out the harmony and blends into the background. — [Evan Rogers: Open voicings](https://evanrogersmusic.com/blog-contents/big-band-arranging/open-voicings?format=amp)
- Rimsky-Korsakov: upper and inner pedal notes (static support) work better in orchestral writing than in piano or chamber music, because the orchestra offers more timbres. — [Rimsky-Korsakov (Gutenberg)](https://www.gutenberg.org/files/33900/33900-h/33900-h.htm)
- Band arranging advice: thin textures are underused (melody alone, melody plus bass, melody plus countermelody plus rhythmic accompaniment). — summary of a concert-band arranging source, seen only in search results and not fetched directly (see Gaps).

### Inferences
- Suggested engine vocabulary (one const object, per rule 9): `Melody`, `MelodyDouble` (octave or unison reinforcement), `Countermelody`, `Pad` (sustained harmony, HS/SS), `Comp` (rhythmic harmony, HRS: strums, afterbeats, arpeggios), `Bass`, `Pedal` (SS), `Punctuation` (stabs/fills in melody gaps), `Percussion`.
- "Different colour from the melody" (Rimsky-Korsakov) plus "a different section for the backing" (scoredchanges) give a timbre-contrast constraint: harmony roles should come from a different family than the melody instrument whenever the ensemble allows it.

### Gaps
- Open Music Theory's orchestration chapter returned 403, so its exact taxonomy is unverified.
- Adler, Piston, Blatter, Sebesky and Lowell/Pullig texts were not reachable online. I have not paraphrased them from memory.

## 2. How many instruments per role; when and how to double the melody

### Takeaway
The melody carries the most weight. It is doubled at the unison for power and richness, or at the octave (usually above) for brilliance and penetration. Harmony is normally four real parts, and any extra instruments double the upper parts in octaves, never the tenor or bass. For an inner melodic voice, a distinct timbre matters more than the number of players.

### Cited Findings
- Rimsky-Korsakov: most harmony is four-part. Extra notes are usually octave doublings of the upper parts, and the bass is doubled only in the lower octave. — [Rimsky-Korsakov (Gutenberg)](https://www.gutenberg.org/files/33900/33900-h/33900-h.htm)
- In widely spaced writing, double only the soprano and alto in octaves. Doubling the tenor produces close writing, and doubling the bass sounds heavy. Unison notes that come from correct doubling are fine, but consecutive octaves between upper parts are not. — [Rimsky-Korsakov (Gutenberg)](https://www.gutenberg.org/files/33900/33900-h/33900-h.htm)
- Don't double the bass of a dominant inversion in the upper parts. — [Rimsky-Korsakov (Gutenberg)](https://www.gutenberg.org/files/33900/33900-h/33900-h.htm)
- Unison doubling (Violins I + II) gains power and richness without changing the colour. Octave doubling of the melody is common in the very high register and adds "expression, fullness and firmness". Dividing a section into octaves halves the players on each line and reduces resonance, so use it sparingly. Violas plus cellos in unison give rich resonance, with the cello predominating. — [Rimsky-Korsakov (Gutenberg)](https://www.gutenberg.org/files/33900/33900-h/33900-h.htm)
- Three-part chords usually use two instruments of one timbre and one of another, rather than three different timbres. — [Rimsky-Korsakov (Gutenberg)](https://www.gutenberg.org/files/33900/33900-h/33900-h.htm)
- Rubin's example reinforces the melody by doubling it an octave higher in the flute. The secondary (inner) melodic voice "needs to be clearly distinguished as it is an inner voice and could be aurally lost". Clarinet was chosen over oboe (too strident there) and over flute (weakest in that range). — [Rubin (UMN Duluth)](https://www.d.umn.edu/~jrubin1/JHR%20Orchestration%20I1.htm)
- Big band featured soloist: "When an instrument is featured it's usually best to leave the rest of the section out." — [Evan Rogers](https://evanrogersmusic.com/blog-contents/big-band-arranging/open-voicings?format=amp). If the soloist is a trombonist, the backing should come from another section (e.g. saxes), not the remaining trombones. Be wary of letting one backing instrument play an individual line, even for a few notes, because it distracts from the soloist. — [scoredchanges.com PDF](https://www.scoredchanges.com/how-to/backings.pdf)
- Marching/concert band guidance (search summary of the Yale Precision Marching Band arranging guidelines; the page itself 404'd): give the melody to trumpets or trombones, the most easily heard sections, and give the other section a countermelody or accompaniment figure. Doubling the melody at the third, or at the fifth for power chords, ensures it is heard even if sections are missing. — [Yale bands arranging guidelines (search snippet)](https://bands.yalecollege.yale.edu/es/yale-precision-marching-band/music/ypmb-junta/arranging-guidelines)
- Revelli (1962) is reported as saying that "inherent doubling" thickens the band sound and is a weakness in instrumentation. — search summary only; [Ch.2 Question of Balance (marchingartseducation.com)](https://marchingartseducation.com/wp-content/uploads/2017/07/Ch.2_QuestionofBalance.pdf)

### Inferences
- Suggested engine defaults:
  - Melody: 1 instrument. Add a unison double for power in loud sections. Add an octave-above double when a bright instrument is available and the melody would stay below the doubler's ceiling.
  - Harmony: up to 4 real voices. Any extra instrument doubles the soprano or alto an octave up. Never double the tenor or bass voice at the octave above.
  - Bass: 1 voice. Optionally double it an octave below, never above.
  - Countermelody: at most 1, in a contrasting family.
- With guitar, saz, kanun and piano together (all plucked or struck), the "different colour" rule cannot always be met. In that case separate the roles by register and articulation (sustain versus short) instead.

### Gaps
- I found no numeric "N players per role" guidance in citable form (e.g. a 2:1 ratio of melody to accompaniment players).
- The Yale and McBeth/Revelli primary texts were not read directly.

## 3. Register: spacing, low interval limits, separation, crossing

### Takeaway
Follow the harmonic series: wide intervals low, close intervals high. Keep the bass within about an octave of the part above it, avoid empty gaps in the middle register, and keep any interval narrower than a fifth or octave above that interval's low limit. Accompaniment must not cover the melody. Crossing is acceptable only when deliberate and when the crossing parts differ in timbre.

### Cited Findings
- The natural harmonic series "may serve as a guide to the orchestral arrangement of chords". — [Rimsky-Korsakov (Gutenberg)](https://www.gutenberg.org/files/33900/33900-h/33900-h.htm)
- "The bass should rarely lie at a greater distance than an octave from the part directly above it." — [Rimsky-Korsakov](https://www.gutenberg.org/files/33900/33900-h/33900-h.htm). Note that this is stricter than chorale practice, which allows more than an octave between bass and tenor. Treat the octave as a soft limit.
- "Nothing is worse than writing chords, the upper and lower parts of which are separated by wide, empty intervals." Fill the middle parts as the outer voices diverge and thin them as the outer voices converge. — [Rimsky-Korsakov](https://www.gutenberg.org/files/33900/33900-h/33900-h.htm)
- Woodwinds and brass:
  - Overlaying (instruments stacked in their normal register order) is the preferred method for close four-part writing.
  - Crossing and enclosure are acceptable if deliberate, and should not pair a weak register with a piercing one.
  - Brass writing should be "of the close order with no empty spaces".
  — [Rimsky-Korsakov](https://www.gutenberg.org/files/33900/33900-h/33900-h.htm)
- Low interval limit (LIL): the "lowest possible position they can be played together without sounding muddy". The limits are guidelines, not rules. Consonant intervals such as the fifth can sit lower than dissonant ones such as the minor second. When checking a voicing, assume the root is present even if another instrument plays it. Loud low brass is less forgiving than soft low strings. — [Robin Hoffmann, Low Interval Limits](https://www.robin-hoffmann.com/tutorials/low-interval-limits/)
- Sweetwater: "As intervals increase, the lowest acceptable pitches go down". The tritone holds up well even low.
  - Major third: lowest at B1–D#2. Major seventh: can be built from F1. Sweetwater's B1 is "an octave plus a half step below Middle C", so its convention is **middle C = C3**. In scientific pitch notation (C4 = middle C) those pitches are B2–D#3 and F2.
  - Search-snippet values from Sweetwater pages, in its own convention: m2 E2–F2, M2 Eb2–F2, m3 C2–Eb2, P5 "C#1–G#1". The P5 value seems garbled; see Gaps.
  - The lowest piano note, about 27.5 Hz, and the B above it are "less than 3.5 cycles apart".
  — [Sweetwater InSync: Low interval limit](https://www.sweetwater.com/insync/low-interval-limit/); [Sweetwater: make orchestrations sound more balanced](https://www.sweetwater.com/insync/make-orchestrations-sound-more-balanced/)
- Big band pads use open voicings by default, "making sure there aren't too many low intervals other than octaves and 5ths". Close voicings low on the stave thicken the sound. Bass trombone should not go below the stave in soft pads. Trombones blend up to about G above the bass stave. — [Evan Rogers](https://evanrogersmusic.com/blog-contents/big-band-arranging/open-voicings?format=amp)
- "Don't let the pad cover the melody." — [Evan Rogers](https://evanrogersmusic.com/blog-contents/big-band-arranging/open-voicings?format=amp). Placing the melody above the backing is common but not required, "especially if the melody is on a stronger instrument". — [Taming the Saxophone](https://tamingthesaxophone.com/theory/arranging/jazz-backings)
- Countermelody parts may cross the melody, preferably when they use a different timbre or section. — [Taming the Saxophone](https://tamingthesaxophone.com/theory/arranging/jazz-backings)
- Harp, with its large compass, can be "freely displaced between the treble and bass registers" as embellishment. — [Rubin](https://www.d.umn.edu/~jrubin1/JHR%20Orchestration%20I1.htm)

### Inferences
- Engine rules:
  - (a) Sort voices from bass up. Gaps between adjacent voices may be larger low and should shrink higher up. Bass-to-next-voice should be at most 12 semitones (soft) and 19 semitones (hard).
  - (b) No interval between adjacent sounding notes (bass included) below its LIL.
  - (c) The top of the accompaniment should stay below the melody's current note. Suggested margin: at least a minor third, or keep pads at least an octave below when they share the melody's family. Allow exceptions when the melody instrument is much stronger.
  - (d) Penalise unison or crossing between the melody and a same-family accompaniment voice.
- Suggested LIL table in **scientific pitch notation (C4 = middle C)**, converted from Sweetwater's C3 convention where verified: m2 ≥ E3, M2 ≥ Eb3, m3 ≥ C3, M3 ≥ B2. These match the commonly reproduced chart; see Gaps for the unverified remainder.

### Gaps
- The full per-interval LIL chart (P4, tritone, P5, sixths, sevenths) could not be read: Hoffmann's chart is an image and Sweetwater returned 403. The widely reproduced values (from the reviewer's general knowledge, **unverified here**) in SPN are: m2 E3–F3, M2 Eb3–F3, m3 C3–Eb3, M3 Bb2–D3, P4 A2–D3, TT B2–F3, P5 Bb1–F2, m6 F2–Db3, M6 F2–D3, m7 F2–Eb3, M7 F2–E3.
  - These partly conflict with the Sweetwater snippet: its M3 example B1–D#2 (C3 convention) is B2 in SPN, a semitone higher than Bb2.
  - Verify these values before encoding them.
- I found no numeric melody-to-accompaniment separation rule in the sources. The margins above are my proposal.

## 4. Voice leading for inner accompaniment voices

### Takeaway
Inner and pad voices should move smoothly (common tones held, small steps, few leaps) and avoid consecutive octaves between upper parts. Voicings should be unambiguous (keep the 3rd and 7th) and should be denser or more dissonant at points of tension, plainer at points of rest.

### Cited Findings
- Consecutive octaves between upper parts are not acceptable. Unisons that come from correct doubling are. — [Rimsky-Korsakov](https://www.gutenberg.org/files/33900/33900-h/33900-h.htm)
- In sustained harmony, "the resonance of different harmonic parts must be equally balanced". — [Rimsky-Korsakov](https://www.gutenberg.org/files/33900/33900-h/33900-h.htm)
- Pad voicing:
  - Keep lines smooth, because large leaps make a part stand out against the melody.
  - Fill in the guide tones (3rds and 7ths) first, and add 9ths, 11ths and 13ths afterwards.
  - "Avoid ambiguous voicings in pads." Omitting the 3rd or 7th can imply a different chord.
  - Avoid minor 2nds and minor 9ths in stable chords.
  - Use close intervals at climaxes and open intervals at resting chords.
  - Plan in short score to avoid crossed parts.
  — [Evan Rogers](https://evanrogersmusic.com/blog-contents/big-band-arranging/open-voicings?format=amp)
- Pads are built "from the bottom note up" (the reverse of a soli, which starts from the melody). The bass trombone usually takes the root, but not always. — [Evan Rogers](https://evanrogersmusic.com/blog-contents/big-band-arranging/open-voicings?format=amp). Conversely, a pad's lowest note "is not necessary to put… on the root… use various inversions to compliment the lead line". — [scoredchanges.com PDF](https://www.scoredchanges.com/how-to/backings.pdf). **Disagreement:** Rogers defaults to the root at the bottom; scoredchanges encourages inversions. In an engine with a separate bass role, the scoredchanges view applies, because the bass instrument already supplies the root.
- The backing line should move smoothly, with attention to voice leading, and riffs should follow chord changes, ideally by moving in scale steps. — [Taming the Saxophone](https://tamingthesaxophone.com/theory/arranging/jazz-backings)
- A held chord in one section can be contrasted with moving chords weaving around it in another section, with no clash provided they start or end on roughly the same chord. — [scoredchanges.com PDF](https://www.scoredchanges.com/how-to/backings.pdf)

### Inferences
- Engine rule: pick each pad voicing by minimising total semitone movement from the previous voicing (nearest-voicing search). Hold common tones. Require the 3rd (and the 7th, if the chord has one). Reject parallel octaves or fifths between any two non-bass accompaniment voices, and between an accompaniment voice and the melody. A strict-counterpoint ban on parallel fifths is the classical rule; the sources here state only the octave ban explicitly.

### Gaps
- No fetched source states a parallel-fifths ban in orchestral texture. That rule comes from common-practice voice-leading texts, which were not fetched here.

## 5. Dynamic balance between families

### Takeaway
Rimsky-Korsakov gives the only numeric balance table found. In forte: 1 trumpet = 1 trombone = 1 tuba = 2 horns, and 1 horn = 2 of any woodwind. In piano, all winds are roughly equal. A whole string section equals 1 wind instrument in piano and 2 in forte. Melody predominates, and backings are reduced by dynamics, register, mutes or rests.

### Cited Findings
- Forte, brass: "1 Trumpet = 1 Trombone = 1 Tuba = 2 Horns". Forte, woodwind: "1 Horn = 2 Clarinets = 2 Oboes = 2 Flutes = 2 Bassoons". In piano, all wind instruments are roughly equal. Strings (medium orchestra): in piano, one string section (e.g. Violins I) equals 1 wind instrument ("Violins I = 1 Flute"); in forte it equals 2 ("Violins I = 2 Flutes = 1 Oboe + 1 Clarinet"). Mark horns one degree louder than the other brass (e.g. horns p when trumpets and trombones are pp). — [Rimsky-Korsakov, Ch. I (Gutenberg)](https://www.gutenberg.org/files/33900/33900-h/33900-h.htm)
- Backings: "The melody should obviously predominate over the backings". Take care with range and volume so the backing doesn't "swamp" the melody, considering each section's tonal strength. Muting trumpets helps. — [Taming the Saxophone](https://tamingthesaxophone.com/theory/arranging/jazz-backings)
- Trombones placed above the saxes in a pad should sit in a register where they can play quieter than the saxes. — [Evan Rogers](https://evanrogersmusic.com/blog-contents/big-band-arranging/open-voicings?format=amp)
- Rubin's "Type I" exercise omits dynamics and aims for "equal balances between the parts" through orchestration ("superimposed equalization"). In other words, balance by instrument choice before using dynamics. — [Rubin](https://www.d.umn.edu/~jrubin1/JHR%20Orchestration%20I1.htm)
- Band balance models: McBeth's 1972 "pyramid" (more weight in the low voices) became standard in schools. A critique ("Escaping the Pyramid Trap", Ken Thompson) argues it is why melodies often fail to stand out over accompaniment. — search summary of [marchingartseducation.com Ch.2 Question of Balance](https://marchingartseducation.com/wp-content/uploads/2017/07/Ch.2_QuestionofBalance.pdf). **Disagreement:** pyramid (bass-heavy) balance versus melody-first balance.
- Low-interval mud depends on dynamics: loud low brass is less forgiving than soft low strings. — [Robin Hoffmann](https://www.robin-hoffmann.com/tutorials/low-interval-limits/)

### Inferences
- Encode a per-family "forte weight": trumpet, trombone, tuba = 2. Horn = 1. Each woodwind = 0.5. Bowed-string section = 1 (2 in forte); a single synthesised bowed string might be about 0.5. Plucked instruments (guitar, saz, kanun) are not covered by Rimsky-Korsakov. They decay fast, so they would plausibly rank at or below woodwind for sustained weight but carry well on attacks; this is my extrapolation, not sourced.
- Dynamic offsets: melody at a reference level (0 dB). Countermelody about one dynamic level below. Pad or comp about two levels below. Bass about one level below. The "one level" step comes from Rimsky-Korsakov's horn adjustment; mapping a level to roughly 4–6 dB is my assumption. Scale gain down by the number of instruments sharing a role, so that a role's total weight never exceeds the melody's.

### Gaps
- I found no numeric dB guidance, and no sourced weights for plucked or folk instruments (kanun, saz, guitar).
- McBeth's pyramid percentages were not read.

## 6. Bass line styles and the rhythmic complement of harmony instruments

### Takeaway
The bass plays roots on strong beats. Common patterns are root–fifth alternation (two-beat/oom-pah), walking quarter notes (root on beat 1, approach tones into the next chord) and pedal points. Harmony instruments fill the rhythmic gaps the bass and melody leave: afterbeats against the bass's downbeats, sustained pads when the melody is busy, and stabs or fills only in melody rests.

### Cited Findings
- Alternate (root–fifth) bass: alternating between root and fifth, often with the fifth below the root. — [Alternate bass (wiki mirror)](https://wiki.riteme.site/wiki/Alternate_bass)
- Waltz accompaniment: bass on beat 1, chord on beats 2 and 3. Stride: a low root or fifth alternating with a chord higher up. — [Accompanying (wiki mirror)](https://wiki.riteme.site/wiki/Accompanying); [James Piano Music: left-hand accompaniments](https://jamespianomusic.blogspot.com/p/different-left-hand-accompaniments.html)
- Walking bass: the root and fifth are the most important notes, with the 3rd and 7th as guide tones; priority is root, then fifth, third, seventh; a steady rhythm matters most. A starting pattern is root on beats 1–2 and fifth on beats 3–4. — [The Jazz Piano Site: walking bass](https://www.thejazzpianosite.com/jazz-piano-lessons/jazz-chord-voicings/walking-bass-lines/?amp=1); [Yamaha Hub: walking basslines](https://hub.yamaha.com/guitars/bass/how-to-construct-walking-basslines); [Premier Guitar: A walking tour of bass lines](https://www.premierguitar.com/a-walking-tour-of-bass-lines) (blog and tutorial quality, not textbook)
- Stabs and riffs "nearly always fill the gaps in and around the melody". Placed over the tune, "they may confuse the melody". Stab phrases work best with some unity, such as repeated riffs. — [Taming the Saxophone](https://tamingthesaxophone.com/theory/arranging/jazz-backings)
- Countermelody: "The counterpoint should sustain while the melody is moving and vice versa." Contrary motion works well. If the melody is in unison or octaves, set the counterpoint in block harmony, and the reverse. — [Taming the Saxophone](https://tamingthesaxophone.com/theory/arranging/jazz-backings)
- Riffs should be kept simple so they don't obscure the soloist, and should be added one at a time. Pass the backing between sections, with rests so players can breathe. — [scoredchanges.com PDF](https://www.scoredchanges.com/how-to/backings.pdf)
- Rhythmic or melodic activity in a pad helps phrasing and breathing at slow tempos. — [Evan Rogers](https://evanrogersmusic.com/blog-contents/big-band-arranging/open-voicings?format=amp)
- Short separated string chords sound best in forte with wind support. — [Rimsky-Korsakov](https://www.gutenberg.org/files/33900/33900-h/33900-h.htm)
- Accompaniment motifs (e.g. oscillating thirds recast as a sixteenth–sixteenth–eighth figure) can be passed between instruments for rhythmic continuity. — [Rubin](https://www.d.umn.edu/~jrubin1/JHR%20Orchestration%20I1.htm)

### Inferences
- Complementary-rhythm engine rule: build an onset grid per beat. The bass owns the strong beats (1 and 3 in 4/4, beat 1 in 3/4). Comp or strum instruments take the afterbeats (2 and 4, or 2–3 in waltz), or sustain. Punctuation onsets are allowed only where the melody has a rest or a note held longer than one beat. Countermelody onsets are preferred where melody notes are sustained. Cap simultaneous new onsets per subdivision, excluding drums: for example, at most two roles attacking on one sixteenth, unless the moment is an accented tutti.
- Bass style by genre:
  - folk / march / Turkish march repertoire: root–fifth two-beat;
  - ballad: pedal or roots held on the downbeat;
  - swing: walking (root on beat 1, chord tones on 2–3, chromatic or scale approach into the next root on 4).

### Gaps
- No academic or textbook source on "rhythmic layering" or complementary rhythm was retrieved. The bass-style sources are blogs and tutorials. Sebesky and Lowell/Pullig would be the authoritative references but were not accessible.
