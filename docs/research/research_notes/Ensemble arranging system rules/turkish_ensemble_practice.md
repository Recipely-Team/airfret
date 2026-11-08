# Turkish Ensemble Practice: How Parts Are Distributed (folk / THM, fasıl, mehter, davul-zurna, marches)

Scope note: notes for an arranging engine. Each section separates **traditional practice** from **modern (20th-c.+) arranged practice**. Patterns I could not verify from a fetched source this session are listed under Inferences or Gaps and marked "unverified (common teaching form)". The report writer should not present them as cited fact.

Key source quality:
- Kınık (2011), Erciyes Ü. SBE Dergisi 30, "Türk Halk Müziği Çalgı Topluluklarının Yapılanması ve Bağlama". A primary, academic source on THM ensemble structure, read in full: [DergiPark PDF](https://dergipark.org.tr/en/download/article-file/219568)
- Karaol & Tunçer (2015), Medeniyet Sanat 1, "Usul Analyses in Mecmua-i Saz ü Söz". Gives present-day stroke patterns for several usuls: [DergiPark PDF](https://dergipark.org.tr/en/download/article-file/150662)
- TDV İslâm Ansiklopedisi "Davul". An authoritative encyclopedia entry: [TDV](https://islamansiklopedisi.org.tr/davul)
- Wikipedia (EN) articles were used for mehter and the İstiklal Marşı dates only.
- chromatone.center was judged **unreliable**. Its "Aksak Semai 2+2+2+2+2" contradicts the standard 3+2+2+3 grouping. Do not use it.

---

## 1. Heterophony: what it is and how instruments realise it

### Takeaway
Turkish makam and folk ensembles are basically **one melody played by everyone at once**. Each instrument plays its own idiomatic version of the line: its own ornaments, fills, sustains or re-attacks, and its own octave. The texture comes from those differences plus percussion that states the usul, not from chords. For an engine, "heterophony" means one source melody passed through per-instrument transforms (octave shift, ornament insertion, rhythmic subdivision or sustain). It does not mean independent voices.

### Cited Findings
- The classical repertoire is commonly called monophonic, but the ornamentation and variation across the ensemble make "heterophonic" the more accurate term. The texture is a solo singer with a small instrumental group (ney, kanun and others) — [tousauxbalkans.net, Classique ottoman](https://www.tousauxbalkans.net/Cat%C3%A9gorie:Classique_ottoman)
- Ottoman music is described as "modal, heterophonic music with a richly developed melodic line and complex rhythmic structures" — [Wikipedia: Ottoman music](https://en.wikipedia.org/wiki/Ottoman_music)
- In Turkish classical music the instruments and singers play versions of the same melody, so harmony is not a feature of the style — [Kaitlin Bove, Turkish Classical Music](https://kaitlinbove.com/turkish-classical-music) (performer site; secondary)
- Heterophony is defined as each instrument or voice performing versions of the same melodic line with varying embellishment and improvisation. A bowed fiddle may play the melody, play heterophony with the oud, or improvise — [Fiveable study guide](https://fiveable.me/world-music/unit-3/traditional-instruments-ensemble-types-middle-east/study-guide/8T9gOwlxaLXo0Onq) (tertiary)
- The ney is end-blown with six front holes and a thumb hole, and a skilled player covers about 2.5 octaves or more — [UPF/CompMusic repository thesis](https://repositori.upf.edu/server/api/core/bitstreams/954344ac-1fe8-40e9-a9af-e9c504e52858/content)
- Makam scales use at least 24 pitches per octave in theory (AEU system, Pythagorean basis) — [U. Washington dissertation](https://digital.lib.washington.edu/researchworks/bitstream/handle/1773/28816/1182.pdf?sequence=1)
- When extended past one octave, makam scales do not necessarily repeat the first octave's notes. Upper-octave notes can differ, so octave transposition is not perfectly neutral — [rsexp blog, Traditional music of Turkey](https://rsexp.blogspot.com/2019/07/traditional-music-of-turkey.html) (blog; secondary)
- Folk: in THM ensembles "bağlamas usually voice the main part [ana parti] and are mostly in the leading role" in traditional repertoire. Regional plectrum styles (yöresel tezene tavırları) shaped around the bağlama keep it in front — [Kınık 2011, p. 218](https://dergipark.org.tr/en/download/article-file/219568)
- Folk instruments already produce incidental multi-voicing in traditional playing. A bağlama in **kara düzen** tuning gives natural I–IV–V sonorities on open strings, and the **Karadeniz kemençe is polyphonic by nature**: it bows two or three strings, giving drones and parallel fourths — [Kınık 2011, p. 218](https://dergipark.org.tr/en/download/article-file/219568)

### Inferences
- An engine rule for heterophony: generate one `coreMelody`, then for each instrument apply (a) an octave offset from its register table (section 2), (b) an idiom transform: plucked instruments (bağlama, kanun, ud, kopuz) re-strike or tremolo long notes, while winds and bowed instruments (ney, kaval, kemençe, keman) sustain and slide, (c) ornament density (lead instrument high, supporting instruments low).
- Because upper-octave makam pitches can differ, an engine with 12-TET western instruments should transpose by exact octaves of the same pitch class. That matches what the tutorial-style sources describe, and the microtonal nuance is lost anyway.
- Wide octave separation is normal in practice (ney and kanun often sound above a voice, the tanbur and ud around or below it), but I found no source that gives a fixed octave-placement table for classical instruments. See Gaps.

### Gaps
- No fetched source gave concrete octave-placement conventions for ney / kemençe / kanun / tanbur / ud relative to written pitch. Practitioner knowledge, **unverified**: Turkish makam notation is written about a fourth or fifth above concert pitch depending on the "ahenk" (transposition level) the ensemble uses (e.g. *bolahenk* vs *kız/mansur* ahenk), and the ney's name (mansur, kız, şah) sets its ahenk. Check against Arel–Ezgi–Uzdilek literature or the Turkish Wikipedia "Ahenk" article.
- No source found that formally names a "leader" instrument in fasıl (see section 3).

---

## 2. THM (TRT / state folk ensembles): bağlama family, unison, drone, percussion, harmonised arrangements

### Takeaway
The THM "toplu icra" format grew out of TRT's radio choirs and later Ministry of Culture state ensembles. The **bağlama family is the backbone** and mostly plays the main melody in unison and octaves. **Kaval and kemane** give long notes. **Bendir and koltuk davulu** keep the usul for the whole piece, and other percussion is added and stays quieter. Modern arrangements add parts in either Western harmony or İlerici's **quartal "dörtlü armoni"**. A Western-orchestra mapping already exists: cura is the violin, tambura bağlama the viola, divan the cello, and bas bağlama the double bass.

### Cited Findings
**Institutions and history**
- Bodies that perform arranged THM include Ministry of Culture state THM choirs and instrumental groups, TRT THM choirs and ensembles, and university ensembles. "Both Western and Turkish-music harmony are used in their performances" — [Kınık 2011, p. 218](https://dergipark.org.tr/en/download/article-file/219568)
- Ensemble (group) performance of folk instruments is traced to TRT's early radio-choir years. Ranges were benchmarked to a standard diapason — [DergiPark article via search summary](https://dergipark.org.tr/en/download/article-file/219568)

**Bağlama family: members, registers, transposition**
- Most common members: **divan**, short- and long-neck **tambura bağlama**, **cura**, and **bas bağlama**, the last adapted from the bass guitar "in roughly the last quarter century" — [Kınık 2011, p. 224](https://dergipark.org.tr/en/download/article-file/219568)
- Gazimihal (quoted in Kınık) sees the family sizes as **soprano, alto, tenor and bass** parts. From cura through tambura to divan, first strings only, the range covers **3.5 octaves**. Adding bas bağlama gives another octave, about **5 octaves in all** — [Kınık 2011, p. 224](https://dergipark.org.tr/en/download/article-file/219568)
- The Western mapping, verbatim in substance: **violin = cura or tambura bağlama; viola = tambura bağlama or bağlama; cello = divan bağlama; double bass = bas bağlama or divan bağlama** — [Kınık 2011, p. 225](https://dergipark.org.tr/en/download/article-file/219568)
- Kara düzen tuning (long neck) tunes the bottom string to B, C or D, so the instruments are named Mi, Mi-bemol and Fa bağlama. The standard ensemble name is the **"Fa"** instrument: first string at D, so the written C fret sounds F — [Kınık 2011, p. 227](https://dergipark.org.tr/en/download/article-file/219568)
- **Fa tambura (bağlama): sounds a perfect fifth below written.** An E-flat tambura sounds a major second below the Fa tambura — [Kınık 2011, p. 227](https://dergipark.org.tr/en/download/article-file/219568)
- **Fa divan: the lowest member, sounding a perfect fifth plus an octave below written.** It can be written in bass clef — [Kınık 2011, p. 228](https://dergipark.org.tr/en/download/article-file/219568)
- **Fa cura: sounds a perfect fourth above written.** It is "the instrument that most effectively meets the need for high notes" in a THM ensemble. Its small frets need clean fretting, so larger E-flat curas, or curas played from re as karar, are sometimes used, though these are weaker in the high register — [Kınık 2011, p. 229](https://dergipark.org.tr/en/download/article-file/219568)
- An encyclopedia entry places the cura at the top, with the tambura one octave and the divan sazı two octaves below it. The bağlama curası is usually tuned an octave above the bağlama, or a fifth above the tambura — [Küre Ansiklopedi: Cura](https://kureansiklopedi.com/tr/detay/cura-b4686); [KTB: Bağlama](https://www.ktb.gov.tr/EN-98662/baglama.html)
- The **şelpe** technique (playing by hand, without a plectrum) is increasingly used as an ensemble colour — [Kınık 2011, p. 225](https://dergipark.org.tr/en/download/article-file/219568)

**Winds, bowed instruments and long notes**
- **Kaval** is the most-used and most dominant wind and "meets the need for long tones in the ensemble". The A-karar kaval spans about 2.5 octaves, from the A an octave below the treble-clef second space to 1.5 octaves above it. Its high notes are risky, so it should be dropped from passages where intonation would suffer. Kaval and kemane blend well because both are sustaining and close in loudness — [Kınık 2011, p. 230](https://dergipark.org.tr/en/download/article-file/219568)
- **Mey**: B-flat and F meys are preferred. It is suited to slurred lines and **not** to fast passages, and its range is a little over one octave. It is quieter than kaval and kemane, so the balance has to be managed — [Kınık 2011, pp. 230–231](https://dergipark.org.tr/en/download/article-file/219568)
- **Kemane (kabak kemane)**: the most clearly audible instrument in the ensemble, with a range a little over two octaves in first position. It can play fast passages and solos, and must be played with restrained dynamics — [Kınık 2011, p. 231](https://dergipark.org.tr/en/download/article-file/219568)
- **Bas kopuz** (bowed, about cello size) has recently been used to supply **sustained bass**. The Karadeniz kemençe and hegit are used according to repertoire — [Kınık 2011, p. 231](https://dergipark.org.tr/en/download/article-file/219568)
- Zurna, tulum and sipsi are used only for limited stretches, depending on repertoire — [Kınık 2011, p. 231](https://dergipark.org.tr/en/download/article-file/219568)

**Percussion in THM ensembles**
- Percussion: davul, koltuk davulu, darbuka, bendir, tef (with or without jingles), daire, koz, wooden spoons. "**Bendir and koltuk davulu are the most frequent, and are generally used from the beginning to the end of the piece.** The others are used according to the course of the piece. When several are used at once, the others accompany bendir and koltuk davulu and do not overpower the main rhythm instrument." A well-tuned daire adds a satisfying bass sound — [Kınık 2011, p. 226](https://dergipark.org.tr/en/download/article-file/219568)

**Score order (Özbek et al. 1989, quoted in Kınık)**
- 1 Kaval, 2 Mey, 3 Kemane, 4 Kemençe, 5 Tar, 6 Rhythm/percussion, 7 Cura, 8 Tambura, 9 Divan, 10 Bas kopuz, 11 Bas bağlama — [Kınık 2011, pp. 231–232](https://dergipark.org.tr/en/download/article-file/219568)
- Kınık concludes that the **bass voice is always needed**, so bas bağlama has become "inevitable" in these ensembles, with bas kopuz as a bowed sustained-bass complement — [Kınık 2011, p. 232](https://dergipark.org.tr/en/download/article-file/219568)

**Harmonisation: İlerici's quartal harmony (dörtlü armoni)**
- The harmony can be Western, or Kemal İlerici's **dörtlü armoni** (harmony built in fourths), which some consider closer to makam character. It follows the makam's seyir and its asma karar and karar (half and final cadence) degrees. Example chords are built on A-karar Hüseyni — [Kınık 2011, pp. 218–219](https://dergipark.org.tr/en/download/article-file/219568) (citing İlerici 1981, *Bestecilik Bakımından Türk Müziği ve Armonisi*)
- Voice-leading rules (verbatim in substance): (1) contrary motion as much as possible; (2) do not use dissonances (2nds, 7ths, augmented 4th, diminished 5th, 9ths) in succession; (3) **no more than two perfect 4ths or 5ths in a row**; (4) in two-voice writing, start at any interval, including a fifth, octave, unison or fourth; (5) **half cadences (asma karar) sound good on a fifth**; (6) **end on a fourth**, or if that is impossible on a fifth, unison or octave — [Kınık 2011, p. 219](https://dergipark.org.tr/en/download/article-file/219568)
- Dissonance resolution: **2nd → 4th, 7th → 5th, augmented 4th → perfect 5th, diminished 5th → augmented 4th, 9th → octave**, preferably by contrary motion, otherwise one voice holds while the other moves — [Kınık 2011, p. 220](https://dergipark.org.tr/en/download/article-file/219568)
- Saygun went with Bartók on the 1936 Anatolian collecting trip, and Bartók's ideas on treating folk material shaped Saygun's writing — [unknowncomposers.org](https://unknowncomposers.org/2020/08/15/ahmet-adnan-saygun-a-pioneer-who-brought-together-romanticism-western-modernism-and-turkish-folk-song/); [DergiPark 1208069](https://dergipark.org.tr/tr/download/article-file/1208069)

### Inferences
- Engine default for "THM ensemble": **melody in unison and octaves** across cura (+8va), bağlama (written) and divan (−8va). Kaval or kemane double the melody with sustained long notes and drop out of high passages. Bendir or koltuk davulu play the usul throughout. Darbuka or def join only in livelier sections, at lower volume. Optional bas bağlama plays the karar (tonic) and the 5th or 4th on strong usul beats.
- The drone is idiomatic: open-string sympathetic resonance in kara düzen (tonic, fourth and fifth), and Karadeniz kemençe parallel fourths and drones. Practical drone choices are the karar of the makam plus its fourth or fifth.
- "Accompaniment in thirds" is a Western-harmony option. The Turkish-national option is a second voice in **4ths and 5ths**, following İlerici's rules: never more than two parallel perfect intervals, cadence on a 4th or unison.
- Western mapping for mixed ensembles: violin can share the cura line, viola the bağlama, cello the divan, double bass or bass guitar the bas bağlama.

### Gaps
- Usul stroke patterns for THM-specific usuls. See section 6 for what was verified.
- I did not fetch a primary source on Saygun's own harmonisation techniques. Commonly reported, **unverified**: he used quartal and quintal structures and modal counterpoint derived from the makam.

---

## 3. Fasıl / Türk sanat müziği / klasik: who leads, who supports, taksim

### Takeaway
The classical ensemble (ince saz) is tanbur, ney, kemençe, ud, kanun and keman, with percussion: kudüm in the classical or Mevlevi setting, darbuka and def in fasıl. Everyone plays the composed melody heterophonically under or with the solo singer. Improvised **taksim** opens a fasıl and links its pieces. Percussion articulates the usul cycle.

### Cited Findings
- Typical instruments: tanbur, ney, kemençe, oud, kanun, violin. **Darbuka is the most important percussion in a fasıl ensemble.** Kanun is often grouped with ud, ney, clarinet, violin and darbuka in the popular fasıl format — [ipfs Wikipedia mirror: Ottoman classical music](https://bafybeiemxf5abjwjbikoz4mc3a3dla6ual3jsgpdr4cjr3oz3evfyavhwq.ipfs.4everland.io/wiki/Ottoman_Classical_Music.html); [CompMusic: Turkish instruments](https://compmusic.upf.edu/index.php/node/55)
- Form: a fasıl is a suite of an instrumental prelude (**peşrev**), vocal compositions that "begin with and are punctuated by instrumental improvisations (**taksim**)", and an instrumental postlude (**saz semaisi**). A strict classical fasıl stays in one makam — [ipfs Wikipedia mirror: Ottoman classical music](https://bafybeiemxf5abjwjbikoz4mc3a3dla6ual3jsgpdr4cjr3oz3evfyavhwq.ipfs.4everland.io/wiki/Ottoman_Classical_Music.html)
- Kanun is a zither with mandal levers that retune each course, which makes microtonal intervals playable — [Wikipedia search summary, Ottoman music](https://en.wikipedia.org/wiki/Ottoman_music)
- The kemençe gives a nasal, penetrating timbre that matters for microtones and ornaments. The voice follows the kemençe's inflections, or breathes in unison with the ney — [Fiveable](https://fiveable.me/world-music/unit-3/traditional-instruments-ensemble-types-middle-east/study-guide/8T9gOwlxaLXo0Onq) (tertiary)
- Percussion strokes split between hands: **düm (accented) on the right hand, the lighter tek strokes on the left**. CompMusic's usul videos plot them as R/L lines, with the cycle starting at R(1) — [CompMusic: Usul examples](https://compmusic.upf.edu/examples-usul-mmt). MEB's kanun module also teaches **"right hand düm, left hand tek"** for practising usul on the kanun — [MEB TYMM kanun module](https://tymm.meb.gov.tr/muzik-okullari-bireysel-calgi-egitimi-dersi-kanun-modulu/unite/1277)

### Inferences
- Role table for an engine:
  - **Melody (heterophonic)**: ney, kemençe, keman, kanun, ud, tanbur. All play the composed line.
  - **Ornament or fill specialists**: kanun (fast runs, tremolo-like repeated notes, octave doublings across the two hands) and kemençe or keman (slides, sustained ornamented line).
  - **Lower-middle body**: ud and tanbur (and in fasıl, ud often doubles the line an octave below).
  - **Taksim soloists**: any melodic instrument, typically ney, kanun, ud, tanbur, keman or clarinet. One soloist at a time, out of tempo, with optional drone on the karar.
  - **Usul**: darbuka and def (fasıl), kudüm or bendir (classical / Mevlevi).
- None of the sources found names a formal "leader". In practice the singer or the senior instrumentalist leads (often kanun or ud in fasıl), but this is **unverified** here.

### Gaps
- No primary source fetched on the exact lead/support hierarchy in fasıl, or on octave conventions (e.g. kanun doubling in octaves between its hands). Next step: Feldman, *Music of the Ottoman Court* (1996), or Turkish theses on "fasıl heyeti".

---

## 4. Mehter: instrumentation, unison, usul, march meter

### Takeaway
The mehter is a loud open-air band. **Zurnas (and borus, natural trumpets) play the melody in unison**, and the **percussion section (davul, nakkare, kös, zil) is as large as the melodic section**. Ensemble size is counted in "kat" layers: in a nine-kat band every instrument type is multiplied by nine. The march meter is articulated by davul and kös on the düm beats, with nakkare filling.

### Cited Findings
- "The zurna is the most fundamental music instrument of the mehter band." Instruments: zurna (including **kaba zurna** for low pitch), **kös** (giant kettledrum), **nakkare** (small paired kettledrums), **davul** (bass drum), **zil** (cymbals), **boru** (trumpet), and **çevgen** (stick with concealed bells, carried by the choir) — [Wikipedia: Ottoman military band](https://en.wikipedia.org/wiki/Ottoman_military_band)
- Two zurna types are named: **kaba zurna** ("rough", low) and **cura zurna** (high). The kös came in "horse, camel and elephant" sizes, and the ruler's kös stood before his tent — [search summary of mehter sources incl. ktb.gov.tr](https://ktb.gov.tr/EN-98653/janissary-mehter-music.html); [istanbultarihi.ist](https://istanbultarihi.ist/599-mehter-in-istanbul-during-the-ottoman-empire)
- **Kat system**: bands were six-, seven- or nine-kat. The final nine-kat form had **nine each of davul, zurna, nakkare, zil and boru, plus one or two kös and a mehterbaşı**. In the early 19th century the vizier's band had nine drums, nine pipes, seven trumpets and four cymbals — [Wikipedia: Ottoman military band](https://en.wikipedia.org/wiki/Ottoman_military_band)
- Mehter declined after Mahmud II abolished the Janissaries in 1826, was partially revived in 1911 under the military museum, and was fully restored as a Turkish Armed Forces band in 1953 — [Wikipedia: Ottoman military band](https://en.wikipedia.org/wiki/Ottoman_military_band)
- **Ceng-i harbî**: the name comes from the clash of cymbals in battle. It became an **usul name in the Ottoman mehter**, used for war compositions and some folk tunes — [TDV İslâm Ansiklopedisi: Zil](https://islamansiklopedisi.org.tr/zil)
- Davul with kös in the mehter had named signal beats: departure (kûs-i rihlet), forming ranks (tabl-ı saf), directing battle (tabl-ı cengî / kûs-i gazâ), end of battle (tabl-ı âsâyiş), and victory (tabl-ı beşâret / kûs-ı müjde). Silent drums signalled that the standards were in danger — [TDV: Davul](https://islamansiklopedisi.org.tr/davul)
- Haydn, Mozart and Beethoven imitated mehter (e.g. Beethoven's "Turkish March", and the march in the Ninth's finale) — [Wikipedia: Ottoman military band](https://en.wikipedia.org/wiki/Ottoman_military_band)

### Inferences
- Engine "mehter" preset: melody played by zurna in unison (cura and kaba zurna an octave apart), plus boru or trumpet on usul-strong beats and phrase ends. Davul and kös play düm on strong beats, nakkare plays a dense tek-fill on the subdivisions, and zil crashes on düm or the cycle start. A kös hit marks the start of the cycle or phrase.
- Western substitute: trumpets and shawm-like oboe in unison, plus bass drum, timpani, snare (in place of nakkare) and cymbals. This is the "alla turca" kit that Western composers took over.
- Mehter marches commonly use sofyan (4/4) and düyek (8/8) as the walking meter. The düyek pattern below (section 6) gives the strong beats: düm on 1 and on the 2-eighth 4th stroke.

### Gaps
- No fetched source gave the stroke notation of ceng-i harbî. **Unverified** practitioner knowledge: it is usually described as a 10/8 usul in the curcuna family. Verify against Özkan, *Türk Mûsikîsi Nazariyatı ve Usûlleri*, before use.
- Unison playing is strongly implied by the instrumentation and the melodic style but was not stated verbatim in the fetched texts.

---

## 5. Davul-zurna: tokmak vs çubuk; halay, zeybek, karşılama

### Takeaway
Davul-zurna is the pair that accompanies almost all Anatolian folk dance. The **tokmak** (thick beater, right hand, thick skin) plays the main accents, the **düm**. The **çubuk** (thin switch, left hand, thin skin on the opposite face) keeps up the light filler strokes, the **tek**. I found no fetched source with per-dance stroke grids for halay, zeybek or karşılama.

### Cited Findings
- **Tokmak**: one piece of wood with a knobbed end (güdük), about 40 cm long, held in the right hand. Its strokes are called **çöven**. **Çubuk** (çıbık): hard wood such as juniper or dogwood, 1–2 cm shorter than the tokmak. It is held between the thumb and index fingertip of the left hand, resting on the drum, and "**maintains the rhythm on the opposite side to the tokmak**". The tokmak side takes the thicker skin, the çubuk side the thinner one. In some regions a cord touching the tokmak skin gives a buzzing sound. The davul hangs from the left shoulder with the rim resting on the left thigh — [TDV İslâm Ansiklopedisi: Davul](https://islamansiklopedisi.org.tr/davul)
- The tokmak plays the main beats and the çubuk the lighter ones. The high skin on the left is struck with the thin switch and the low skin on the right with the big beater — [KTB: Davul](https://www.ktb.gov.tr/EN-98686/davul.html) (via search summary)
- "Almost all folk dances in Anatolia are danced with davul-zurna." **Bar** is the general name of halay-type dances accompanied by davul-zurna. In Erzurum the davulcu plays solo in the middle of the halay ring — [TDV: Davul](https://islamansiklopedisi.org.tr/davul)
- Ramazan and bayram mâni interludes on the davul use **2+2+3** groupings of 7 or 9 strokes — [TDV: Davul](https://islamansiklopedisi.org.tr/davul)
- Regional types: kaba davul and cura davul (Southern Anatolian Türkmen), and the Kars davulu (smaller, played lying flat by hand, softly accompanying recitative sections) — [TDV: Davul](https://islamansiklopedisi.org.tr/davul)
- Zeybek is in slow 9/8 (ağır aksak / ağır zeybek, 9/4). Karşılama is typically 9/8 (2+2+2+3) — [Wikipedia: Aksak](https://en.wikipedia.org/wiki/Aksak); [TDV: Yürük aksak](https://islamansiklopedisi.org.tr/yuruk-aksak)

### Inferences
- A davul voice for the engine has two articulations. **Tokmak = düm**: low and loud, on the usul's düm positions. **Çubuk = tek**: high and light. Çubuk fills every remaining subdivision in a running roll-like pattern, which is how davulcus sound in practice.
- The zurna doubles the melody, often with a second zurna holding a drone (dem) on the karar. That is widely described in practice but **not verified** in a fetched source here.
- Halay commonly runs in 2/4 or 4/4 (sofyan-like), often accelerating, or in aksak meters regionally. **Unverified.**

### Gaps
- Per-dance tokmak/çubuk grids (halay, zeybek, karşılama) were not found in fetched sources. The next source to check is Turkish theses on "davul icra teknikleri" (e.g. Tezara / YÖK Tez).

---

## 6. Usul stroke patterns (düm-tek)

### Takeaway
Usul is notated with vocables. **Düm / dü-üm** are strong low strokes (single or double length). **Tek, te-ke, tekkya, te-ek** are light strokes. Düm is played on the right hand or tokmak, tek on the left hand or çubuk. Patterns verified from an academic source: düyek, semai, devr-i hindi, evfer, sofyan (outline), plus the 9/8 aksak grouping and stroke vocables.

### Cited Findings
- Vocable system: "düm, dü-üm, tek, tekkyaa, teke, te-ek". Düm and dü-üm are a strong low beat of single or double duration, and the tek types are light beats of half, single or double duration — [Wikipedia: Rhythm in Turkish music](https://en.wikipedia.org/wiki/Rhythm_in_Turkish_music)
- Beat counts (Wikipedia list): Nim sofyan 2, Semai 3, Sofyan 4, Türk aksağı 5, Yürük semai 6, Sengin semai 6, Devr-i hindi 7, Devr-i turan 7, Düyek 8, Müsemmen 8, Aksak 9, Evfer 9, Ağır aksak 9, Çifte sofyan / Raks aksağı 9, Aksak semai 10 — [Wikipedia: Rhythm in Turkish music](https://en.wikipedia.org/wiki/Rhythm_in_Turkish_music)
- **Düyek (8/8), present-day form**: `Düm(1) tek(2) tek(1) düm(2) tek(2)` in eighth-note units, summing to 8. Kantemiroğlu's form ends with tek(1) — [Karaol & Tunçer 2015, p. 54](https://dergipark.org.tr/en/download/article-file/150662)
  - On an 8th-note grid this is **`D T – T D – T –`**: position 1 düm, 2 tek (held over 3), 4 tek, 5 düm (held over 6), 7 tek (held over 8).
- **Semai (3/4 or 3/8), present-day form**: `Düm(1) tek(1) tek(1)` — [Karaol & Tunçer 2015, p. 63](https://dergipark.org.tr/en/download/article-file/150662). This matches MEB's "düm-tek-tek" — [MEB TYMM](https://tymm.meb.gov.tr/muzik-okullari-bireysel-calgi-egitimi-dersi-kanun-modulu/unite/1277)
- **Devr-i hindi (7/8), present-day form**: `Düm(1) tek(1) tek(1) düm(2) tek(2)`, summing to 7 (3+4 feel) — [Karaol & Tunçer 2015, p. 49](https://dergipark.org.tr/en/download/article-file/150662)
- **Evfer (9/8), present-day form**: `Düm(2) tek(1) ke(1) düm(2) tek(1) tek(2)`, summing to 9, grouped 2+2+2+3 — [Karaol & Tunçer 2015, p. 54](https://dergipark.org.tr/en/download/article-file/150662)
- **Devr-i revan (14 units)**: `Düm(3) düm(2) tek(2) düm(3) tek(2) tek(2)` — [Karaol & Tunçer 2015, p. 50](https://dergipark.org.tr/en/download/article-file/150662)
- **Sofyan (4/4)**: taught as "düm – tek – tek – düm"-type movement (big step, small step, small step, big step). MEB presents it as a compound usul built on nim sofyan and semai, which students learn first — [MEB TYMM kanun module](https://tymm.meb.gov.tr/muzik-okullari-bireysel-calgi-egitimi-dersi-kanun-modulu/unite/1277). **Note:** this movement exercise is not the full stroke pattern (see Inferences).
- **Aksak (9/8)**: a compound of sofyan (4) and Türk aksağı (5), at three tempo levels: **9/16 yürük aksak, 9/8 aksak, 9/4 ağır aksak**. Same strokes, different tempo — [TDV: Yürük aksak](https://islamansiklopedisi.org.tr/yuruk-aksak); [salihbora.com: Yürük aksak](https://www.salihbora.com/yuruk-aksak-usulu/). Prominent grouping **2+2+2+3** — [Wikipedia: Aksak](https://en.wikipedia.org/wiki/Aksak). A secondary site gives the vocables as "DÜ-ÜM, TE, KE, DÜ-ÜM, TE-EK, TEK" — [search summary of adanamusikidernegi.com](http://adanamusikidernegi.com/?pnum=364&pt=Aksak+Usul%C3%BC) (secondary; garbled)
- **Curcuna (10/8)**: grouping **3+2+2+3** — [paulboizot.co.uk: Irregular rhythms](https://paulboizot.co.uk/irregular.htm) (secondary; tentative)
- Türk aksağı (5) is formed from nim sofyan (2) plus semai (3) — [search summary, MEB/teaching sources](https://tymm.meb.gov.tr/muzik-okullari-muziksel-isitme-okuma-yazma-dersi/unite/1061?kod=OB1)

### Inferences
Engine-ready grids. **V** = verified above; **U** = unverified, the common teaching form from practitioner knowledge, to check before shipping. Units are the usul's base note value. `D` = düm (low / right / tokmak), `T` = tek (high / left / çubuk), `k` = ke (light, left), `-` = hold.

| Usul | Meter | Pattern (per unit) | Status |
|---|---|---|---|
| Nim sofyan | 2/4 | `D T` | U |
| Semai | 3/8 or 3/4 | `D T T` | V |
| Sofyan | 4/4 | `D - T k` (düm-2, te, ke) | U. The MEB movement form is D T T D |
| Türk aksağı | 5/8 | grouped 2+3, düm on 1 and tek strokes in the 3-group (exact durations unconfirmed) | U |
| Yürük semai | 6/8 | `D - T D T -` (düm te-ke düm tek) | U |
| Devr-i hindi | 7/8 | `D T T D - T -` | V |
| Devr-i turan | 7/8 | grouped 2+2+3 | U |
| Düyek | 8/8 | `D T - T D - T -` | V |
| Aksak | 9/8 | `D - T k D - T - T`. Common darbuka form: düm(2) tek-ka(1+1) düm(2) tek(2) tek(1), grouped 2+2+2+3 | grouping V, strokes U |
| Ağır aksak | 9/4 | same as aksak at half speed (zeybek) | V (structure) |
| Evfer | 9/8 | `D - T k D - T T -` | V |
| Aksak semai | 10/8 | `D - - T k D - T - -`, grouped 3+2+2+3 | U |
| Curcuna | 10/8 | `D - T - D D - T - -`-type, grouped 3+2+2+3 | grouping secondary, strokes U |
| Sengin semai | 6/4 | slow: düm(3) tek(1) tek(2)-type | U |
| Ceng-i harbi | 10/8 | not found | Gap |

- Rule for the engine: map `D` to the low voice of each drum (darbuka centre, bendir/def centre, davul tokmak, nakkare left or low drum, kös) and `T`/`k` to the rim or high voice. Fills on unmarked units are idiomatic in folk and fasıl (darbuka and davul çubuk), but should be omitted in strict classical playing (kudüm).

### Gaps
- No fetched primary source gave verified stroke grids for nim sofyan, sofyan, türk aksağı, yürük semai, aksak (full strokes), aksak semai, curcuna, sengin semai or ceng-i harbi. salihbora.com and CompMusic hold these as **images** that WebFetch cannot read. Recommended primary: Özkan, *Türk Mûsikîsi Nazariyatı ve Usûlleri – Kudüm Velveleleri*, or Ungay, *Türk Musikisinde Usuller ve Kudüm*, both cited by Karaol & Tunçer. Alternatively the individual salihbora.com pages (e.g. https://www.salihbora.com/sofyan-usulu/), viewed in a browser.

---

## 7. Marches: İstiklal Marşı and İzmir Marşı, harmonisation and band arrangements

### Takeaway
Both are **Western-tonal marches**, not makam pieces. İstiklal Marşı is Osman Zeki Üngör's melody, adopted in 1930, which Edgar Manas was commissioned in 1932 to harmonise and orchestrate. The official recording is in **G minor**. İzmir Marşı's composer is disputed and it circulates in many band arrangements. For an engine, these should use **Western functional harmony and brass-band or orchestral scoring**. Turkish instruments can be added in unison with the melody (mehter-style) without changing the harmony.

### Cited Findings
- İstiklal Marşı: lyrics by Mehmet Akif Ersoy, adopted on 12 March 1921. Ali Rıfat Çağatay's music was used 1924–1930. **Osman Zeki Üngör's** music was adopted in 1930. In 1932 **Edgar Manas** was commissioned to "harmonize and orchestrate the melody created by Üngör". The 2013 official orchestral and choral recording is in **G minor**, with an alternate recording in E minor. Only the first two quatrains are sung officially. The Presidency hosts the official score as a PDF — [Wikipedia: İstiklal Marşı](https://en.wikipedia.org/wiki/%C4%B0stiklal_Mar%C5%9F%C4%B1)
- A Turkish source credits Manas with the harmonisation and **İhsan Servet Künçer** with the bando (military band) arrangement — [Milliyet](https://www.milliyet.com.tr/galeri/istiklal-marsi-istiklal-marsi-sozleri-okunusu-kabulu-ve-notalari-nedir-6701279) (via search summary; not independently verified)
- Accounts conflict over when Üngör wrote the melody. Sözcü gives 1922, and reports Cemal Reşit Rey's claim that the melody was first written for other lyrics — [Sözcü](https://www.sozcu.com.tr/istiklal-marsi-103-yil-once-bugun-kabul-edildi-p29023)
- İzmir Marşı, composer disputed: it is often attributed to İzzeddin Hümayi Bey, which Murat Bardakçı rejects. Another account says it was published as the "Kafkasya Marşı" — [Habertürk, Bardakçı](https://www.haberturk.com/yazarlar/murat-bardakci/1380237-izmir-marsi-muammasi). A further claim says the first recorded İzmir Marşı (1908–1912) was by palace bandmaster Mehmet Ali Bey — [Serbestiyet](https://serbestiyet.com/yazarlar/larda-yuzen-alsancak-10690/). Another names İsmail Zühdü Bey — [SALT Research archive](https://archives.saltresearch.org/handle/123456789/19633). A related Greek-catalogued "Marche de Smyrne" exists — [Aegean Univ. rebetiko archive](https://vmrebetiko.aegean.gr/en/item-en?id=4415)

### Inferences
- Engine rules for these marches: 2/4 or 4/4 march, tonic–dominant bass on beats 1 and 3 (tuba or bass, bas bağlama, davul tokmak), off-beat chords on 2 and 4 (horns, guitar, bağlama strums), melody in unison and octaves (trumpets, clarinets, zurna or ney +8va), snare or nakkare fills. A mehter flavour adds davul düm on 1 and 3, zil on 1, and zurna doubling the trumpet melody.
- Minor-key (İstiklal, G minor) harmony is functional i–iv–V7–i with secondary dominants, a Western idiom. Do not apply İlerici quartal rules here.

### Gaps
- No primary source fetched on the internal voicing of Manas's orchestration or Künçer's band score. The official presidency PDF score would be the primary source. Its URL was not retrieved.
- No source found on the official harmonisation or band arrangement of İzmir Marşı. The many military-band versions are uncatalogued in the fetched material.
