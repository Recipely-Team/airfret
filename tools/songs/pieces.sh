#!/bin/sh
# Regenerates the real pieces in src/domain/lessons/catalog/pieces/ and their score fixtures from the
# public-domain Mutopia Project MIDI files (downloaded into tools/songs/.cache/, which git ignores).
set -e
cd "$(dirname "$0")/../.."
C=tools/songs/.cache
M=https://www.mutopiaproject.org/ftp
mkdir -p "$C"
[ -f "$C/bwv1007.mid" ] || { curl -sL -o "$C/bwv1007-mids.zip" "$M/BachJS/BWV1007/bwv1007/bwv1007-mids.zip" && unzip -o -q -j "$C/bwv1007-mids.zip" bwv1007.mid -d "$C"; }
[ -f "$C/claro-de-luna.mid" ] || curl -sL -o "$C/claro-de-luna.mid" "$M/TarregaF/claro-de-luna/claro-de-luna.mid"
P=src/domain/lessons/catalog/pieces
F=src/application/__fixtures__/scores
node tools/songs/midi-to-notes.mjs "$C/bwv1007.mid" --transpose 12 --reference "$F/bach-prelude.json" --module "$P/bach-prelude.ts" --name BACH_PRELUDE \
  --doc "J. S. Bach, Cello Suite No. 1 in G, BWV 1007 — Prélude, an octave up as guitarists play it in G. Score: Mutopia Project, Schirmer 1916 edition, public domain." >/dev/null
node tools/songs/midi-to-notes.mjs "$C/bwv1007.mid" --reference "$F/bach-prelude-bass.json" --module "$P/bach-prelude-bass.ts" --name BACH_PRELUDE_BASS \
  --doc "J. S. Bach, Cello Suite No. 1 in G, BWV 1007 — Prélude at the cello's own pitch, which on bass needs all 24 frets. Score: Mutopia Project, Schirmer 1916 edition, public domain." >/dev/null
node tools/songs/midi-to-notes.mjs "$C/claro-de-luna.mid" --reference "$F/claro-de-luna.json" --module "$P/claro-de-luna.ts" --name CLARO_DE_LUNA \
  --doc "F. Tárrega, Claro de Luna — his guitar arrangement of the Adagio of Beethoven's Moonlight Sonata, in D minor with the sixth string tuned to D. Score: Mutopia Project, Madrid: Ildefonso Alier (plate 5754), public domain." >/dev/null
