# Sample and reference credits

Prepared with `tools/samples/prepare.mjs`. Only freely redistributable sources may ship here.

| Set | Source | Licence | Status |
|---|---|---|---|
| `bass/` | FreePats — *Finger Bass YR* (Yamaha RBX, recorded by Andrea Biasior), 2019-09-30 | CC0 1.0 | Verified (LICENSE.txt in the release) |
| `electric/` | FreePats — *Clean Electric Guitar* | CC0 1.0 | Per FreePats; re-check the release's LICENSE.txt |
| `banjo/` | sfzinstruments — *ganjo* (SX 6-string guitar banjo, recorded by itsclipping), github.com/sfzinstruments/ganjo @ `ccff5cd` | CC0 1.0 | Verified (LICENSE.md in the repo). 25 of 58 regions kept (first take per note); G2 and G3 left out with `--skip-untrusted` (≥ 60 c sharp) |
| `steel/` | Meta Open Sound guitars (`INSGuitar…` files) | Freely redistributable | Confirmed by the owner, 2026-11-04; record the licence name and link here |
| `nylon/` | Meta Open Sound guitars (`INSGuitar…` files) | Freely redistributable | Confirmed by the owner, 2026-11-04; record the licence name and link here |

## Real-song references (not shipped in the build)

| Piece | Source | Licence |
|---|---|---|
| Bach, BWV 1007 Prélude — score | Mutopia Project, Schirmer 1916 edition | Public domain |
| Tárrega, *Claro de Luna* — score | Mutopia Project, Madrid: Ildefonso Alier, plate 5754 | Public domain |
| Bach, BWV 1007 Prélude — recording | Pablo Casals, 1938 (Naxos Historical restoration), Wikimedia Commons | Public domain |

The test downloads the recording into `tools/songs/.cache/` (git-ignored) and pins it by SHA-256.
