# Sample and reference credits

Prepared with `tools/samples/prepare.mjs` (and, for one-shot hand-drum takes, ffmpeg: one gain per instrument,
leading silence cut, a short fade). Only freely redistributable sources may ship here: CC0 preferred; CC BY and
CC BY-SA allowed with the attribution below (owner's decision, 2026-11-06). Files adapted from a CC BY-SA source
stay under CC BY-SA 4.0.

| Set | Source | Licence | Status |
|---|---|---|---|
| `bass/` | FreePats — *Finger Bass YR* (Yamaha RBX, recorded by Andrea Biasior), 2019-09-30 | CC0 1.0 | Verified (LICENSE.txt in the release) |
| `electric/` | FreePats — *Clean Electric Guitar* | CC0 1.0 | Per FreePats; re-check the release's LICENSE.txt |
| `banjo/` | sfzinstruments — *ganjo* (SX 6-string guitar banjo, recorded by itsclipping), github.com/sfzinstruments/ganjo @ `ccff5cd` | CC0 1.0 | Verified (LICENSE.md in the repo). 25 of 58 regions kept (first take per note); G2 and G3 left out with `--skip-untrusted` (≥ 60 c sharp) |
| `piano/` | FreePats — *Upright Piano KW* (small, 2019-07-03; a Kawai upright recorded by Gonzalo and Roberto), freepats.zenvoid.org/Piano/acoustic-grand-piano.html, archive SHA-256 `e346ef19…7047f` | CC0 1.0 | Verified (cc0.txt and readme.txt in the archive). 26 recordings, a minor third apart, C1–B7 |
| `hand-drums/darbuka-*` | Wikimedia Commons — *Derbake Grave.ogg* (düm) and *Derbake Agudo.ogg* (tek; ka is it played lower), by **ZappaMidiPF** | **CC BY-SA 4.0** | Verified on the file pages; trimmed and level-matched, so these two files are CC BY-SA 4.0 |
| `hand-drums/conga-*`, `tumba-*` | VS Chamber Orchestra 2 Community Edition (Versilian Studios; recorded by Sam Gossner and Simon Dalzell), github.com/sgossner/VSCO-2-CE — *Conga-*, *Tumba-HitN* and *-Tap1* | CC0 1.0 | Verified (LICENSE in the repo) |
| `marimba/`, `xylophone/`, `glockenspiel/` | VS Chamber Orchestra 2 Community Edition (Versilian Studios), github.com/sgossner/VSCO-2-CE — *Percussion/Marimba* (outrigger mallets, loud), *Xylo* (medium, ff), *Glock* (medium) | CC0 1.0 | Verified (LICENSE in the repo). The library names its notes an octave low (middle C = C3); pitches measured and mapped to the true octave. 10, 8 and 6 recordings |
| `clarinet/`, `flute/`, `trumpet/` | VS Chamber Orchestra 2 Community Edition (Versilian Studios), github.com/sgossner/VSCO-2-CE — *Woodwinds/Clarinet/susLong* (v2), *Woodwinds/Flute/susvib*, *Brass/Trumpet/sus* (v1) | CC0 1.0 | Verified (LICENSE in the repo). Named an octave low like the mallets; pitches measured (the fundamental sits an octave above every name; the clarinet take named F#5 is an F). 11, 10 and 10 recordings, 6 s each |
| `oboe/`, `bassoon/`, `horn/`, `trombone/`, `tuba/` | VS Chamber Orchestra 2 Community Edition (Versilian Studios), github.com/sgossner/VSCO-2-CE — *Woodwinds/Oboe/Sus*, *Woodwinds/Bassoon/sus*, *Brass/F Horn/sus*, *Brass/Tenor Trombone/sus*, *Brass/Tuba/sus* (a middle dynamic each) | CC0 1.0 | Verified (LICENSE in the repo). Named an octave low; pitches measured. 9, 13, 10, 11 and 9 recordings (the horn from C2: its A1 pedal take has almost no fundamental), up to 6 s |
| `kopuz/` | Freesound — *Baglama Notes* pack by **fcerim** (freesound.org/people/fcerim/packs/40093/): single notes of a short-neck baglama (the instrument also called *kopuz* regionally) | CC0 1.0 | Verified on each sound page, 2026-11-07. 17 of the 30 notes (the in-tune semitones; the koma notes kept for later), pitches measured; HQ previews (128 kbps) |
| `kanun/` | Freesound — *kanun isolated notes* by **Barış Bozkurt** (barisbozkurt, freesound.org/s/211133/): every chromatic tone of a Turkish kanun, played one by one | CC0 1.0 | Verified on the sound page, 2026-11-07. Sliced into 35 notes (F3–D♯6) by onset, pitches measured; HQ preview (128 kbps) |
| `hand-drums/bendir-*` | Freesound — *bendir_basicStrokes* by **Barış Bozkurt** (freesound.org/s/140291/, player Eren Ergen, CompMusic) and *BAS BENDIR* by **bassdream** (freesound.org/s/381443/) | CC0 1.0 | Verified on the sound pages, 2026-11-07. Düm and tek sliced from them; peaks set to −3 dB. 2026-11-08: the second düm and tek takes dropped (noise floor within 6 dB of the stroke) |
| `hand-drums/def-*` | Freesound — *TEF* by **bassdream** (freesound.org/s/381440/) | CC0 1.0 | Verified 2026-11-07. The tef's jingle strokes; its düm is the bendir düm above mixed with a tef jingle. 2026-11-08: the *ka* takes dropped (hiss as loud as the stroke); ka plays the tek lower and softer |
| `hand-drums/davul-*` | Freesound — *kopal* and *vitsa* by **Despoina_kalantzi** (freesound.org/s/347492/, /347494/; a davul's tokmak and çubuk) | CC0 1.0 | Verified 2026-11-07. 2026-11-08: the takes cut from her quiet tremolo *trilia* (/347491/) dropped — its room noise was as loud as the strokes |
| `ney/` | Freesound — *Scale of Huzzam Makam* by **ajaysm** (freesound.org/s/194637/, CompMusic) and *Ney Phrase Single Note* by **yurci** (freesound.org/s/328744/, from TUMATA, uploaded with the copyright holders' permission) | CC BY 4.0 / CC BY 3.0 | Verified on the sound pages, 2026-11-07. Notes cut by pitch tracking; the makam's microtones left out (E4–D6, 11 notes). Credit: "Scale of Huzzam Makam" by ajaysm — License: CC BY 4.0; "Ney Phrase Single Note" by yurci — License: CC BY 3.0 |
| `kemence/` | Freesound — *Scale of Ussak Makam* by **ajaysm** (freesound.org/s/194639/, CompMusic, classical kemençe) | CC BY 4.0 | Verified 2026-11-07. Notes cut by pitch tracking (B3–A4, 7 notes). Credit: "Scale of Ussak Makam" by ajaysm — License: CC BY 4.0 |
| `steel/` | Meta Open Sound guitars (`INSGuitar…` files) | Freely redistributable | Confirmed by the owner, 2026-11-04; record the licence name and link here |
| `nylon/` | Meta Open Sound guitars (`INSGuitar…` files) | Freely redistributable | Confirmed by the owner, 2026-11-04; record the licence name and link here |

## Real-song references (not shipped in the build)

| Piece | Source | Licence |
|---|---|---|
| Bach, BWV 1007 Prélude — score | Mutopia Project, Schirmer 1916 edition | Public domain |
| Tárrega, *Claro de Luna* — score | Mutopia Project, Madrid: Ildefonso Alier, plate 5754 | Public domain |
| Bach, BWV 1007 Prélude — recording | Pablo Casals, 1938 (Naxos Historical restoration), Wikimedia Commons | Public domain |

The test downloads the recording into `tools/songs/.cache/` (git-ignored) and pins it by SHA-256.
