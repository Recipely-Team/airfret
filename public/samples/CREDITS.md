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
| `steel/` | Meta Open Sound guitars (`INSGuitar…` files) | Freely redistributable | Confirmed by the owner, 2026-11-04; record the licence name and link here |
| `nylon/` | Meta Open Sound guitars (`INSGuitar…` files) | Freely redistributable | Confirmed by the owner, 2026-11-04; record the licence name and link here |

## Real-song references (not shipped in the build)

| Piece | Source | Licence |
|---|---|---|
| Bach, BWV 1007 Prélude — score | Mutopia Project, Schirmer 1916 edition | Public domain |
| Tárrega, *Claro de Luna* — score | Mutopia Project, Madrid: Ildefonso Alier, plate 5754 | Public domain |
| Bach, BWV 1007 Prélude — recording | Pablo Casals, 1938 (Naxos Historical restoration), Wikimedia Commons | Public domain |

The test downloads the recording into `tools/songs/.cache/` (git-ignored) and pins it by SHA-256.
