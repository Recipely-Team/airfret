# Computational orchestration, arrangement and accompaniment generation: lessons for a rule-based arranging engine

Scope: research systems (projective orchestration, target-based timbre orchestration, accompaniment arrangement, multi-track generation, role/texture annotation), rule-based and constraint-based harmonization (CHORAL, Pachet and Roy), arranger-keyboard style engines (Yamaha NTR/NTT/RTR), and how arrangement quality is evaluated. Everything is aimed at a deterministic TypeScript engine that takes melody + chords + bass + an instrument set and writes each part.

## Q1. Automatic orchestration research: what the main systems do

### Takeaway
Learned orchestrators are, in practice, *note-assignment* systems. They take the notes of a piano or lead-sheet reduction, copy the rhythm, and decide which instrument plays which note. They use hard range and monophony filters and a "rhythmic skeleton per track" as the style variable. All of that is directly codable as rules. The learned parts mostly supply *choices between valid options*: which texture per phrase, which track decorates, and how parts relate inside a section. A rule engine can stand in for these with scored templates plus dynamic programming (DP) over phrases.

### Cited Findings

**Projective orchestration and the POD/LOP database (Crestel, Esling, Heng, McAdams, ISMIR 2017)**
- "Projective orchestration" is defined as first writing a piano score and then orchestrating it. The Projective Orchestral Database pairs piano scores with orchestrations by known composers: 392 MIDI files, i.e. 184 piano/orchestra pairs — [Crestel et al. 2017 (arXiv 1810.08611)](https://ar5iv.arxiv.org/html/1810.08611)
- Representation: a binary piano-roll per instrument, concatenated along the pitch axis. Instruments of the same section (e.g. violins) are merged into one part "following common orchestration practice". Velocity is discarded. Pitches never played by an instrument are removed, which cuts the orchestral vector from 3584 to 795 dimensions — [Crestel et al.](https://ar5iv.arxiv.org/html/1810.08611)
- Task: predict orchestral frame O(t) from piano frame P(t) and the past N orchestral frames. Only event frames, where the content changes, are scored. The model does not learn rhythm: orchestral events are placed at the piano's event times, which the authors call "a reasonable approximation", though composers sometimes add events absent from the piano. Piano silence maps to orchestral silence — [Crestel et al.](https://ar5iv.arxiv.org/html/1810.08611)
- Metric: Accuracy = 100·TP/(TP+FP+FN), counted at note level per event. The strongest baseline was "Repeat" (copy the previous frame), which the authors found surprising. The neural models (cRBM, FGcRBM) assigned "an extremely high probability for every note to be off", and their outputs were "mostly unsatisfying" — [Crestel et al.](https://ar5iv.arxiv.org/html/1810.08611)
- Piano and orchestra were aligned with Needleman-Wunsch on 12-dimensional pitch-class vectors, a representation the authors call "an extremely rough approximation" that still sufficed for alignment — [Crestel et al.](https://ar5iv.arxiv.org/html/1810.08611)
- Crestel's IRCAM thesis (Dec 2018), "Réseaux de neurones pour l'orchestration musicale automatique", targeted projecting piano pieces onto full orchestra in the style of Haydn, Mozart and Beethoven — [IRCAM thesis defence](https://medias.ircam.fr/x533f14)

**Piano to wind band with user-specified instrumentation (Nabeoka, Nakamura, Yoshii, CMMR 2023)**
- Problem: piano score (two hands) to a band score using any subset of a 43-part "maximum instrumentation" covering 28 instruments, unpitched percussion excluded. Training pairs come from *reducing* existing band scores to piano automatically, so every piano note exists in the band score. Orchestration then becomes **a mask that assigns each piano note to zero or more instrument parts** — [Nabeoka et al. 2023](https://zenodo.org/records/10113109/files/cmmr2023_3c-P5.pdf)
- Hard post-processing at inference, i.e. rules on top of the network: (1) keep only notes contained in the input piano score; (2) impose each instrument's pitch range, "written in standard books on orchestration"; (3) a monophonic constraint per part, keeping the most probable onset when several compete; (4) take note durations from the piano score. Octave-shifted copies of the piano (±12) were added as candidates so that wide-range parts can use doubled octaves — [Nabeoka et al.](https://zenodo.org/records/10113109/files/cmmr2023_3c-P5.pdf)
- Results: the best variant, where the instrumentation is given as input and one part is processed at a time, scored an F-score of only about 36–37% on exact pitch and onset match. A prior rule-based study had converted large band scores to smaller ones using hand-built criteria for phrase segmentation, instrument-group extraction and instrument assignment. The authors argue such rules are hard to generalise to piano input — [Nabeoka et al.](https://zenodo.org/records/10113109/files/cmmr2023_3c-P5.pdf)
- Learned behaviour worth copying (Joplin's "The Entertainer" example): **woodwinds took the right-hand notes, brass took the left-hand notes, and within each group the chord voicing "follows the natural order of the parts"** (Trombone 1 above 2 above 3, no crossing) — [Nabeoka et al.](https://zenodo.org/records/10113109/files/cmmr2023_3c-P5.pdf)
- Observed failure modes: the model cannot adapt part roles to the chosen instrumentation, it cannot guarantee that every piano note is covered, and a flute took "only some notes of the melody", which "is usually judged as inappropriate". The authors conclude that sequential dependencies between notes need handling — [Nabeoka et al.](https://zenodo.org/records/10113109/files/cmmr2023_3c-P5.pdf)

**AccoMontage (Zhao and Xia, ISMIR 2021): phrase selection plus style transfer**
- Accompaniment is treated as **retrieval of whole reference phrases from a database** (POP909: 11,032 phrases), re-harmonised to the target chords. The selection is a Viterbi/DP path over phrases, costing O(nN²) — [AccoMontage (arXiv 2108.11213)](https://ar5iv.labs.arxiv.org/html/2108.11213)
- Node "fitness" is explicitly **rule-based**: f = α·cos(rhythm_query, rhythm_ref) + β·cos(TIV(chord_query), TIV(chord_ref)). The melody's rhythm is reduced to 3 states per step (onset, hold, rest), and chords are compared in Tonal Interval Vector space. Reference phrases are transposed to all 12 keys, and α = β = 0.5 — [AccoMontage](https://ar5iv.labs.arxiv.org/html/2108.11213)
- Edge "transition" = learned texture-embedding similarity + a **form term**: 1 when the query phrases have the same label (A8 followed by A8) and the reference melodies are near-identical (cosine > 0.99). In effect, *repeated sections should reuse the same accompaniment*. Inference objective: 0.3·Σfitness + 0.7·Σtransition, i.e. **transition smoothness weighted above local fit** — [AccoMontage](https://ar5iv.labs.arxiv.org/html/2108.11213)
- Phrase length must match the query phrase, using labels such as A8/B8. Only 2/4 and 4/4 at 16th-note resolution are supported. The first phrase is filtered by rhythm density and voice count (low, medium or high), which steers the whole path — [AccoMontage](https://ar5iv.labs.arxiv.org/html/2108.11213)
- Listening test with 72 subjects on 14 Nottingham songs, rating coherence, structure and musicality on 1–5 scales. AccoMontage beat both baselines on coherence and structure (p < 0.05) and was marginally better on musicality (p = 0.053). The "Hard Template-Based" baseline, the same selection without style transfer, was beaten — [AccoMontage](https://ar5iv.labs.arxiv.org/html/2108.11213)
- AccoMontage2 adds a harmonisation module for full-length songs — [AccoMontage2 (arXiv 2209.00353)](https://arxiv.org/pdf/2209.00353)

**AccoMontage-3 / structured multi-track arrangement (Zhao et al., arXiv 2310.16334)**
- Three stages: (1) retrieve and recombine piano phrases ("style planning"); (2) re-harmonise; (3) a multi-track orchestrator turns the piano into band tracks — [Zhao et al.](https://ar5iv.labs.arxiv.org/html/2310.16334)
- Representation: segments of 8 beats; tracks as 128×32 piano-rolls at 1/4-beat resolution. The **piano reduction** (track-wise max) is the "content". Each track's **"orchestral function"** is the style variable: its *rhythmic skeleton*, computed as onset counts summed over pitch per time step, normalised by 14. There are 34 instrument classes from Slakh2100, drums excluded — [Zhao et al.](https://ar5iv.labs.arxiv.org/html/2310.16334)
- Qualitative patterns the model learned: counterpoint between acoustic guitar and electric piano; **two guitars with complementary roles (one melodic, one harmonic)**; **strings on the downbeat and brass on the offbeat**; a piano arpeggio added in the second chorus to build flow. A well-orchestrated piece mixes "foundational" tracks, which carry the harmony, with "unique" decorative tracks — [Zhao et al.](https://ar5iv.labs.arxiv.org/html/2310.16334)
- Stated limits: tonal tracks in quadruple meter only, with no triplets, triple meter or drums. Velocity and expressive timing are not modelled — [Zhao et al.](https://ar5iv.labs.arxiv.org/html/2310.16334)
- Better stage-1 piano arrangements give better multi-track results, because the piano layer sets the chord progression and phrase structure. Replacing it with a weaker generator dropped chord accuracy from 0.567 to 0.509 and the structure score from 1.520 to 1.121 — [Zhao et al.](https://ar5iv.labs.arxiv.org/html/2310.16334)

**MMM (Ens and Pasquier 2020)**
- A Transformer generating a separate time-ordered event sequence per track, with track-level and bar-level infilling. Conditioning attributes include instrument type, **note density, polyphony level and note duration** — [MMM (arXiv 2008.06048)](https://arxiv.org/abs/2008.06048v1); [Metacreation MMM page](https://www.metacreation.net/projects/mmm)

**Target-based timbre orchestration (Orchids, Orchidea; Maresz, Cella)**
- Target-based assisted orchestration searches "for the best combinations of orchestral sounds to match a target sound under specified metric and constraints". A dynamic target is split into a series of static targets. Orchidea uses "a mono-objective optimization algorithm that is able to integrate soft symbolic constraints as cost parameters", initialised by relaxed matching pursuit; a separate model links the solutions into a score — [Timbre and Orchestration Resource: Orchidea](https://timbreandorchestration.org/tor/modules/assisted-orchestration/orchidea/tutorials/what-is-assisted-orchestration)
- Orchidea does mono-objective optimisation over multi-dimensional features, building on earlier Orch* tools. Other approaches include a multi-objective genetic heuristic, a constraint solver, and exact ILP, which is optimal but slower than Orchidea's evolutionary search — [Orchidea README](https://github.com/orchidees/Eric/blob/master/README.md); [Bampis, Cella et al., EJOR 2023 (summary)](https://www.bohrium.com/paper-details/target-based-computer-assisted-orchestration-complexity-and-approximation-algorithms/817060306164383744-12367)
- Orchids was the first complete system for abstract and temporal orchestration, optimising timbral mixtures — [IRCAM Orchids project](https://www.ircam.fr/projects/pages/orchestration-assistee-par-ordinateur-orchids)
- Nabeoka et al. argue that spectral, target-based methods are "inappropriate for orchestrating piano scores since spectral features cannot directly capture relevant musical structures such as melody and bass lines" — [Nabeoka et al.](https://zenodo.org/records/10113109/files/cmmr2023_3c-P5.pdf)

### Inferences
- The shared core of every symbolic system above is the same pipeline, and it maps cleanly to rules: **(a)** segment into phrases or events; **(b)** pick a texture or rhythmic skeleton per part per phrase; **(c)** assign pitches from the harmony or reduction into each part under range, monophony and ordering constraints; **(d)** take rhythm and duration from the source, or from the part's skeleton pattern. Learned models fail mostly at (b) and at sequential coherence, which are exactly where a deterministic engine can be strong.
- Rules to copy from what learned systems found:
  1. Group parts into sections. Higher, lighter sections (woodwinds) take the upper material; lower, heavier ones (brass, low strings) take the lower material.
  2. Inside a section, voice the chord top-down in part order, never crossing.
  3. Give each part a *rhythmic role* (downbeat sustain vs offbeat stabs vs arpeggio vs melodic counterline) separate from its pitch content.
  4. Pair same-family instruments complementarily: one melodic, one harmonic.
  5. Reuse the same texture for repeated sections, and escalate it in later repeats (e.g. add an arpeggio part in the second chorus).
  6. Weight smooth phrase-to-phrase transitions more than local fit (AccoMontage used 0.7 vs 0.3).
- A melody must be given to a part *whole or not at all* within a phrase. Splitting a melody across parts, or dropping notes from it, is the classic failure (the wind-band flute example). Rule: role assignment is per phrase, and the lead part gets all melody notes, transposed by octaves if needed to fit its range.
- Timbre-target methods (Orchidea) are not useful for a melody/chords/bass arranger, apart from one idea: hard constraints plus soft costs folded into a single objective.

### Gaps
- No item titled "Orchestrating piano music" by Huang et al. was found. A Transformer-based symphonic generation study is cited as [9] in Nabeoka et al., but I did not identify it. Music Transformer-based arrangement specifics were not retrieved.
- I did not read the full text of Maresz's 2013 Contemporary Music Review article "On computer-assisted orchestration", and no Pachet survey specific to *orchestration* was found. Pachet's constraint harmonization survey is covered in Q3.
- Exact listening-test means for AccoMontage and AccoMontage-3 appear only in figures, not in the text.
- No numeric POD results were retrieved, because the table did not render.

## Q2. Representations for roles and textures, and the constraints and heuristics that produce good results

### Takeaway
The field converges on a small role vocabulary: **melody, harmony (harmonic accompaniment), rhythm (rhythmic accompaniment), bass, and static (pedal or ostinato), plus "mixed"**. These roles are labelled *per bar per track*. Separate attributes cover layer density (voice count), intra-layer relations (homorhythm, parallel motion, octave doubling) and figure type (sustained, repeated, oscillating, scalar). Good-result heuristics are: range filtering, monophony per line, section-ordered voicing, rhythm skeletons per role, density and polyphony targets, and pitch-class fidelity to the chord.

### Cited Findings
- **Piano texture syntax (Couturier, Bigo, Levé, ISMIR 2022; syntax from their earlier work):**
  - Each bar gets one label made of layers separated by "/".
  - Layer function uses **M (melodic), H (harmonic) and S (static: "pedals and ostinati")**, and these can combine (e.g. "HS1" is a persistent arpeggio).
  - **Density** = the number of voices in a layer (M1/H2 means a one-voice melody over a two-voice harmony). **Global density** approximates "the average number of notes perceived simultaneously", usually the sum of the layer densities.
  - Intra-layer relations: **homorhythmy (h), parallel motion (p), octave (o)**. Figures: **sustained (t), repeated notes (r), oscillations (b), scales (s)**. "M2p/HS3hr" is a melody doubled at the third over repeated three-note chords.
  - Sublayers are written in parentheses, and "_" marks sparsity or silence.
  - The dataset covers 1,164 bars of 9 Mozart sonata movements. 31% of labels drew reviewer feedback and 22% were revised, so annotators often disagree.
  — [Couturier et al. ISMIR 2022](https://archives.ismir.net/ismir2022/paper/000061.pdf)
- **Orchestral role labels:**
  - The S3 / MCTL symphony dataset assigns each instrument a role of **melody, rhythm, harmony, or mixed**. It holds more than 13,000 annotations over four symphonies (Mozart, Beethoven, Tchaikovsky, Dvořák), and the annotations are semi-automatic — [S3, ISMIR 2024 LBD](https://ismir2024program.ismir.net/lbd_463.html); [MCTL symphony dataset](https://github.com/kyuchia/mctl-symphony-dataset)
  - Le et al. label each bar of each track as melody, rhythmic accompaniment, harmonic accompaniment, or mixed. Giraud et al. (ISMIR 2014) formalise texture as melody vs accompaniment layers for string quartets — [ISMIR 2014 Giraud et al.](https://archives.ismir.net/ismir2014/paper/000143.pdf); the APSIPA 2025 benchmark paper describing these schemes was found by search, but the fetch failed (connection refused), so the Le et al. details rest on a search snippet only.
- **Track function as rhythm skeleton:** AccoMontage-3's per-track "orchestral function" is purely the onset-count rhythm pattern per time step, which "informs where to put more notes and where to keep silent" — [Zhao et al.](https://ar5iv.labs.arxiv.org/html/2310.16334)
- **Density and polyphony controls:**
  - AccoMontage filters textures by **rhythm density and voice number**, each binned low, medium or high — [AccoMontage](https://ar5iv.labs.arxiv.org/html/2108.11213)
  - MMM conditions on note density, polyphony level and note duration — [Metacreation MMM](https://www.metacreation.net/projects/mmm)
- **Range and playability:**
  - Range filters come from orchestration textbooks, and a monophonic constraint applies per wind part — [Nabeoka et al.](https://zenodo.org/records/10113109/files/cmmr2023_3c-P5.pdf)
  - Crestel et al. drop every pitch an instrument never plays in the corpus — [Crestel et al.](https://ar5iv.arxiv.org/html/1810.08611)
  - Classical CSP harmonizers treat voice ranges as hard or "very bad infraction" constraints. "Voices should never cross each another" is a baseline rule — [Pachet and Roy 2001](https://www.francoispachet.fr/wp-content/uploads/2021/01/pachet-01-Musical_Harmonization_with_Constraints.pdf)
- **Voice-leading costs (from the harmonization literature):** forbidden horizontal intervals (e.g. the tritone); no parallel fifths, octaves or unisons between successive chords; chord-specific doubling rules (do not double the bass of a "6" chord); Baroque three-pitch chords that require a doubling. Ballesta's optimisation criteria for good lines:
  - the soprano should not change direction too often;
  - the soprano and bass should move in contrary motion as much as possible;
  - the soprano should move stepwise as much as possible;
  - the inner parts should be kept as close as possible.
  — [Pachet and Roy 2001](https://www.francoispachet.fr/wp-content/uploads/2021/01/pachet-01-Musical_Harmonization_with_Constraints.pdf)
- **Penalty tiers (Schottstaedt 1984, after Fux):** prohibitions carry infinite penalty (e.g. parallel fifths); "very bad" infractions cost 200 (e.g. leaving a voice's range); "bad" infractions cost 100; lesser rules cost less. Search is best-first with early commitment, so it is incomplete but fast — [Pachet and Roy 2001](https://www.francoispachet.fr/wp-content/uploads/2021/01/pachet-01-Musical_Harmonization_with_Constraints.pdf)
- **Arranger-keyboard part types:** Yamaha style channels are typed by their NTT (note transposition table): Bypass for drums and rhythm, Melody, Chord, Bass, Arpeggio and Guitar. Each type has its own rule for how source-pattern notes are moved to the played chord (details in Q3) — [Yamaha 9000 Pro manual](https://www.manualslib.com/manual/196615/Yamaha-301.html?page=119); [Tyros3 manual](https://www.manualslib.com/manual/477787/Yamaha-Tyros3.html?page=46)

### Inferences
- Suggested domain model for the engine (TypeScript const objects):
  - `Role` = `lead | counter | harmonyPad | harmonyRhythm | arpeggio | bass | pedal | percussion | tacet`;
  - per part per phrase, a `Texture` = { role, voiceCount (density), figure: sustained | repeated | arpeggio | scalar | oscillating, rhythmSkeleton: onset grid per beat, relation to another part: unison | octave | parallelThird | homorhythm | independent }.
  This is a hybrid of the Couturier syntax and AccoMontage-3's rhythm-skeleton "function".
- Hard constraints, which act as filters: instrument range, ideally a comfortable sub-range; monophony for monophonic instruments; the lead gets every melody note; the bass lowest-sounding pitch is the chord bass; no crossing within a section; chord-tone membership for harmony parts.
- Soft costs, applied with tiered weights in the Schottstaedt style:
  - parallel fifths and octaves between independent parts (but *not* between parts declared as doublings);
  - melody/accompaniment register overlap, i.e. accompaniment notes at or above the melody note;
  - leap size and direction changes;
  - common-tone retention, the distance between consecutive voicings;
  - density outside the target band;
  - texture change across a repeated section.
- Register separation: keep harmony voices below the melody and above the bass, with a minimum gap. Keep close-position voicing out of the low register; the "low interval limit" is a standard textbook heuristic, not found in these sources (see Gaps).

### Gaps
- No source here gives quantitative register-separation or low-interval-limit values. These would come from orchestration and arranging texts, not from the computational papers.
- Lakh MIDI role labels: no dedicated public role-label set for LMD was found. Systems instead use instrument program numbers or Slakh's 34 classes. POP909 offers a melody / bridge / piano accompaniment track split, which is known but was not verified in this session.
- The full APSIPA 2025 benchmark paper could not be fetched (connection refused).

## Q3. Rule-based accompaniment and constraint-satisfaction harmonization

### Takeaway
Two mature rule traditions apply directly. **(1) The constraint-based harmonization tradition** solved four-part voicing *technically* by about 2001. The keys were arc-consistency and, above all, structuring the problem: fix a harmonic plan (chord functions) first, then "realise" voicings with chord-level variables. The tradition is explicit that rules are "merely syntactic" and do not guarantee musical interest. **(2) Arranger-keyboard style engines (Yamaha SFF)** do no search at all. Each part is a pre-written pattern on a source chord (CMaj7), and per-part transposition rules (NTR/NTT/RTR, High Key, Note Limit) map it to the live chord. This is the deterministic, real-time model that a TypeScript arranger can copy most directly.

### Cited Findings

**Ebcioğlu's CHORAL**
- About 350 rules in first-order predicate calculus, written from multiple viewpoints (chord skeleton, individual melodic lines, Schenkerian voice leading of descant and bass). It runs as generate-and-test with intelligent backtracking, with "a substantial number of heuristics … for biasing the search toward musical solutions". The rules are production rules, constraints and heuristics, and candidates that violate the constraints are discarded — [search summary of Ebcioğlu 1990 and surveys](https://arxiv.org/pdf/1812.04186); [Pachet and Roy 2001](https://www.francoispachet.fr/wp-content/uploads/2021/01/pachet-01-Musical_Harmonization_with_Constraints.pdf)
- Implemented in BSL, a custom constraint logic language with backjumping. It was "difficult to understand and assess" because of the proprietary language and many interrelated modules. Run times were half an hour to several hours per chorale (Cross) — [Pachet and Roy](https://www.francoispachet.fr/wp-content/uploads/2021/01/pachet-01-Musical_Harmonization_with_Constraints.pdf); [Cross](https://www.bachnetwork.org/ub2/cross.pdf)
- By Ebcioğlu's own assessment, as cited in DeepBach, the outputs do not sound like Bach except for occasional Bachian patterns and cadence formulas — [DeepBach (arXiv 1612.01010)](https://arxiv.org/pdf/1612.01010v1)

**Pachet and Roy, "Musical harmonization with constraints: a survey" (Constraints 6(1), 2001)**
- Formulation: each unknown note is a finite-domain variable whose domain is its voice's range. Harmony rules are constraints of three kinds: horizontal (successive notes of one voice), vertical (simultaneous notes) and sequential (successive chords, e.g. parallel fifths). Rules "can be expressed precisely and locally … usually negative properties", i.e. they specify forbidden combinations — [Pachet and Roy](https://www.francoispachet.fr/wp-content/uploads/2021/01/pachet-01-Musical_Harmonization_with_Constraints.pdf)
- Key structural lesson: treating chords as mere groups of notes is "a mistake". Adding explicit **chord variables** on top of note variables divides the complexity by the density of chords in the space of note quadruplets, and makes unfigured four-part exercises solvable "practically in real time". The alternative (Henz et al., Zimmermann) builds a **harmonization plan** first (degrees and functions), which fixes pitch classes and leaves "only the actual octaves" to solve in a much simpler realisation step — [Pachet and Roy](https://www.francoispachet.fr/wp-content/uploads/2021/01/pachet-01-Musical_Harmonization_with_Constraints.pdf)
- Ovans: full arc-consistency is necessary, and bounds consistency is not enough. Dellacherie's re-implementation of CHORAL in Eclipse got poor results for lack of arc-consistency. Ballesta's system represented *every* relation as a constraint, which was elegant but limited on long melodies. Tsang and Aitken (20 rules, CLP(R)) needed 70 MB to harmonize an 11-note melody — [Pachet and Roy](https://www.francoispachet.fr/wp-content/uploads/2021/01/pachet-01-Musical_Harmonization_with_Constraints.pdf)
- Phon-Amnuaisuk and Wiggins (1998) found a rule-based approach superior to genetic algorithms in solution quality — [Pachet and Roy](https://www.francoispachet.fr/wp-content/uploads/2021/01/pachet-01-Musical_Harmonization_with_Constraints.pdf)
- Ramirez and Peralta maximise the number of **known chord progressions** from a dictionary. The survey suggests that "nice" results contain well-known patterns and typical harmonic solutions — [Pachet and Roy](https://www.francoispachet.fr/wp-content/uploads/2021/01/pachet-01-Musical_Harmonization_with_Constraints.pdf)
- Known failure modes, stated by the survey:
  - "respecting the rules does not guaranty that the result will be musically meaningful or interesting … harmonic rules can be considered as merely syntactic";
  - musical interest comes from the interplay of incompatible criteria (smooth parallel motion vs the parallel-fifth ban);
  - multi-criteria optimisation is "very hard", with "no systematic experiments … on realistic melodies";
  - "the intentional aspect of composition and the combinatorial aspect are mutually exclusive": a rule-correct choice can change the tonal progression;
  - keyboards' one-touch harmonization is "note-to-chord, reactive … without taking into account the context", and real time forbids backtracking.
  — [Pachet and Roy](https://www.francoispachet.fr/wp-content/uploads/2021/01/pachet-01-Musical_Harmonization_with_Constraints.pdf)
- Levitt's constraint language for accompaniment styles, starting from voice ranges and building up to chord-root motion, was enough to specify ragtime piano. Its backtracking solver handled only small or under-constrained problems — [Pachet and Roy](https://www.francoispachet.fr/wp-content/uploads/2021/01/pachet-01-Musical_Harmonization_with_Constraints.pdf)

**Yamaha arranger style engine (SFF1/SFF2 CASM parameters)**
- Each accompaniment channel is a pattern recorded on a **Source Root/Chord**, by default CMaj7. Per-channel rules then transpose it to whatever chord the player fingers — [Yamaha 9000 Pro manual](https://www.manualsdir.com/manuals/227129/yamaha-9000-pro.html?page=136); [Tyros3 manual](https://www.manualslib.com/manual/477787/Yamaha-Tyros3.html?page=46)
- **NTR (Note Transposition Rule)** sets how the root moves:
  - ROOT TRANS transposes in parallel with the root;
  - ROOT FIXED keeps notes "as close as possible to the previous note range", suited to chordal parts;
  - GUITAR transposes notes "to approximate the chords played with natural guitar fingering".
  **High Key** (the upper-octave limit for transposition) is effective only with ROOT TRANS — [Yamaha 301 manual](https://www.manualslib.com/manual/196615/Yamaha-301.html?page=119); [Tyros manual](https://www.manualslib.com/manual/196986/Yamaha-Tyros.html?page=121)
- **NTT (Note Transposition Table)** sets how the chord quality maps:
  - Bypass for drums and rhythm;
  - MELODY for lines, CHORD for chordal parts, and BASS;
  - MELODIC MINOR, which lowers the third a semitone when going from a major to a minor chord (and the reverse), leaving other notes unchanged;
  - variants (HARMONIC MINOR, NATURAL MINOR, DORIAN) and "5th" variants that also move the perfect fifth for augmented and diminished chords;
  - for guitar channels, ALL-PURPOSE, STROKE and ARPEGGIO, the last "specialized for arpeggios … beautiful four-note arpeggio sounds".
  — [Yamaha manuals via search: PSR-S950](https://www.manualowl.com/m/Yamaha/PSR-S950/Manual/319531?page=40); [Tyros5](https://www.manualslib.com/manual/578817/Yamaha-Tyros5.html?page=45); [Tyros4](https://www.manualslib.com/manual/477793/Yamaha-Tyros4.html?page=52)
- **NTT Bass ON** makes the channel play the bass note of a slash chord (on-bass chord) when one is recognised. Recommended settings for rhythm channels are NTR Root Fixed, NTT Bypass, NTT Bass Off — [Genos manual](https://www.manualslib.com/manual/1333828/Yamaha-Genos.html?page=23); [CVP-705 manual](https://www.manualsdir.com/manuals/848904/yamaha-cvp-705b.html?page=60)
- **RTR (Retrigger Rule)** sets what a *held* note does at a chord change:
  - Stop;
  - Pitch Shift ("bend without attack to match the type of the new chord");
  - Pitch Shift to Root;
  - Retrigger ("retriggered with attack at a new pitch");
  - Retrigger to Root.
  — [PSR-8000 manual](https://www.manualowl.com/m/Yamaha/PSR-8000/Manual/152595?page=72); [CVP-609 manual](https://www.manualowl.com/m/Yamaha/CVP-609/Manual/325661?page=58)
- A Note Limit (the low and high pitch limit per channel, which octave-folds transposed notes into range) is also part of style creation in these manuals. Exact wording was not retrieved (403 on the fetch) — [Tyros3 manual page](https://www.manualslib.com/manual/477787/Yamaha-Tyros3.html?page=46)

### Inferences
- The engine should copy the Pachet and Roy structure:
  1. **Plan first.** Chords and functions are given by the song, so the hard combinatorial part is already removed.
  2. **Then realise each part** with a small local search or DP per part, choosing octave and inversion of chord tones to minimise a tiered cost (voice-leading distance, range comfort, spacing, parallels, overlap with the melody).
  Because the plan is fixed, a greedy-with-lookahead or Viterbi pass over chord-tone voicings (a handful of candidates per chord) is deterministic, fast and real-time safe. No general CSP solver is needed.
- The Yamaha model maps one-to-one onto a TypeScript design: `PartPattern` (rhythm, plus pitches written relative to a source chord such as Cmaj7) + `transpositionRule` (rootTrans with highKey | rootFixed (stay near the previous range) | guitar-voicing) + `qualityTable` (bypass | melody | chord | bass | arpeggio | minor variants) + `onChordChange` (stop | pitchShift | retrigger | toRoot) + `noteLimit` (low/high, octave-fold). Each instrument role picks a pattern per section, so arrangement becomes *pattern selection plus deterministic note translation*.
- The keyboards' weakness is that their "note-to-chord, reactive" mapping has no context. The engine should add what AccoMontage adds: per-phrase pattern selection with a smoothness term, and the form rule that repeated sections get the same patterns, escalating in later repeats.
- Rules alone guarantee syntax, not interest. Budget for *variety controls* explicitly: density escalation per section, a counter-melody part in the B section, and fills at phrase ends. Most failures of rule systems are blandness and mechanical repetition, not wrong notes.

### Gaps
- No official Yamaha SFF2/CASM binary format specification was found. Parameter semantics come only from owner and reference manuals. The exact mapping tables inside NTT (e.g. how CHORD maps a Cmaj7 pattern note to a dim7 chord) are not documented in the sources found.
- No commercial arranger engine (Band-in-a-Box, Ketron, Korg) was examined in this pass.
- CHORAL's original paper (Ebcioğlu 1990, J. Logic Programming) was not read directly. The details come from secondary summaries.

## Q4. Evaluation: how arrangement quality is judged

### Takeaway
Evaluation splits into listening tests (5-point Likert, double-blind, on criteria such as coherence, structure, naturalness, creativity, musicality and instrumentation) and objective proxies. The proxies are: chord accuracy against the given chords; faithfulness to the source reduction; inter-track diversity (DOA); structure awareness (similarity of repeated sections); note-level precision/recall/F against references; and MuseGAN-style statistics (empty bars, used pitch classes, qualified notes, polyphonicity, tonal distance between tracks). Several of these can run as **automated tests on a rule engine's output**.

### Cited Findings
- **AccoMontage listening test:** 72 subjects; criteria coherence, structure and musicality on a 1–5 scale — [AccoMontage](https://ar5iv.labs.arxiv.org/html/2108.11213)
- **AccoMontage-3 listening test:** 23 participants, double-blind, 5-point Likert. Criteria: "Harmony and Texture Coherency", "Long-Term Structure", "Naturalness", "Creativity" and "Overall Musicality", with "Instrumentation" added in the ablation — [Zhao et al.](https://ar5iv.labs.arxiv.org/html/2310.16334)
- **AccoMontage-3 objective metrics:**
  - **Chord Accuracy**: the fraction of 1-beat chords, recognised automatically from the output, that match the lead-sheet chords. 0.567 for their system vs 0.423–0.470 for baselines.
  - **Degree of Arrangement (DOA)**: the standard deviation, across tracks, of the KL divergence between each track's pitch-class histogram and the piano reduction's histogram. It measures inter-track tonal diversity; ground truth on LMD (≥5 tracks) is 0.333.
  - **Structure awareness (ILS)**: the ratio of similarity between same-label phrases to global average similarity; ground truth on POP909 is 1.980.
  - **Orchestration faithfulness**: cosine similarity between the input piano and the output's reduction, using pitch-class histograms (0.945) and latent texture (0.215).
  - Latency in seconds per bar.
  — [Zhao et al.](https://ar5iv.labs.arxiv.org/html/2310.16334)
- **Note-level accuracy vs reference orchestrations:** Accuracy = TP/(TP+FP+FN) at events (POD) — [Crestel et al.](https://ar5iv.arxiv.org/html/1810.08611). Per-part precision/recall/F on exact pitch and onset (wind band; best F about 36.8%) — [Nabeoka et al.](https://zenodo.org/records/10113109/files/cmmr2023_3c-P5.pdf). Both are very harsh, since many valid orchestrations exist, and copy-the-previous-frame baselines score well on them.
- Nabeoka et al. also analyse whether outputs reproduce **co-occurrence and exclusion relations among parts**, i.e. which instruments play together and which avoid each other — [Nabeoka et al.](https://zenodo.org/records/10113109/files/cmmr2023_3c-P5.pdf)
- **MuseGAN metrics:**
  - EB, empty bars;
  - UPC, used pitch classes per bar;
  - QN, qualified note rate: notes of at least 3 time steps (a 32nd note); a low QN means the music is "overly fragmented";
  - PP, polyphonicity: the share of time steps with more than two pitches sounding;
  - DP, drum pattern: the share of drum notes in common 8- or 16-beat patterns;
  - TD, tonal distance between a pair of tracks, based on Harte's tonal centroid, where larger means weaker inter-track harmonic relation.
  Implemented in pypianoroll and muspy — [MuseGAN (arXiv 1709.06298)](https://arxiv.org/pdf/1709.06298); [pypianoroll metrics](https://pypianoroll.readthedocs.io/en/latest/metrics.html); [muspy metrics](https://muspy.readthedocs.io/en/latest/doc/metrics.html)
- AccoMontage's objective checks: rhythm-density and voice-number differences between adjacent phrases should be smaller than between random pairs, as a smoothness measure — [AccoMontage](https://ar5iv.labs.arxiv.org/html/2108.11213)

### Inferences
- Automated property tests for a rule engine, as deterministic fixtures, could include:
  - (1) **chord fidelity**: every harmony-part note on a strong beat is a chord tone; target 100%, with a tolerance for passing tones;
  - (2) **melody coverage**: the lead plays 100% of melody notes;
  - (3) **range compliance**: 100% of notes within each instrument's range;
  - (4) **voice crossing / overlap rate** within sections, and the rate of accompaniment notes at or above the concurrent melody pitch; target ≈0;
  - (5) **parallel fifths and octaves** between non-doubling parts;
  - (6) **minor-second / chroma clash rate**: semitone or minor-ninth intervals between the melody and simultaneous accompaniment notes;
  - (7) **TD and pitch-class histogram KL** of each part against the chord (the DOA analogue): keep foundational parts close and decorative parts more varied;
  - (8) **density curve**: notes per beat and simultaneous voices per section, which should rise into choruses and match the target band;
  - (9) **structure consistency**: same-label sections produce identical or near-identical textures (the ILS analogue);
  - (10) **QN / fragmentation** and empty-bar rate per part.
- The fact that "Repeat" wins on POD shows that note-match against one reference is a poor quality measure. Prefer constraint-violation rates plus listening checks. The project already does reference comparison in `test:songs`, which can be extended with the rates above.

### Gaps
- No standard published metric named "voice crossing rate" or "chroma clash" for multi-track arrangement was found. Items (4) and (6) above are proposals, not field standards. Texture-consistency metrics beyond ILS were not found.
- Absolute per-criterion Likert means were not retrievable from the paper text.
