---
name: bug-fix
description: Airfret's regression discipline (CLAUDE.md rule 15) — reproduce, write a failing test named after the symptom, minimal fix, a gate if one could catch the class, and a docs/regressions.md row. Use when fixing reported wrong behaviour, a crash, or a bug found in review. Skip for typos and copy.
---

# Bug fix

1. **Reproduce** and find the root cause, not the nearest symptom.
2. **Write the regression test first** and watch it fail on the unfixed code. Name it after what
   the player saw ("a fist on the neck kept the strings ringing"), not the mechanism.
3. **Minimal fix**; the test passes.
4. **Could a gate have caught it?** Prefer a `scripts/check-structure.mjs` rule (new letter, cite
   the CLAUDE.md rule), then an eslint rule, then a type that makes the state unrepresentable.
5. **Record the class** in `docs/regressions.md` under the right area: bold one-line symptom,
   root cause in a sentence or two, `*Guard:*` naming the test / rule / type.

Camera- or audio-only bugs that no unit test can reach get a row in `docs/qa/manual.md` instead of
a test, and still a `docs/regressions.md` row.
