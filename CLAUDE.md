# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## Read this first: [PROJECT-MAP.md](PROJECT-MAP.md)

A generated one-line-per-file index of `src/`. Read it instead of listing directories.
`npm run map` regenerates it; `check:structure` (rule J) fails while it is stale.

## What this is

**Airfret** — play guitar and bass in the air. A webcam tracks both hands (MediaPipe Hand
Landmarker, in the browser); a virtual instrument is drawn over the mirrored camera image;
every note is synthesised (Karplus–Strong AudioWorklet). Lessons teach songs with a
scrolling timeline and scoring. Vite + TypeScript, no UI framework. Deployed on Vercel.

## Commands

- `npm run dev` — dev server on http://localhost:5180 (copies the MediaPipe WASM first)
- `npm run build` — typecheck + static build to `dist/`
- `npm run check` — **all gates**: lint, typecheck, tests with coverage minimums, structure
- `npm run lint` · `npm run typecheck` · `npm test` · `npm run test:coverage`
- `npm run check:structure` · `npm run map`

## Architecture

Clean Architecture / DDD, the same shape as Recipely. Full text: [`architecture.md`](architecture.md).

```
src/
  core/            Result, Failure, math — building blocks, import nothing
  domain/          music theory, instruments, fretboard geometry, gestures, lessons, ports
  application/     Player, lesson use case, backing track, settings store
  infrastructure/  Web Audio engine, MediaPipe tracker, localStorage — implement domain ports
  presentation/    canvas painters, DOM widgets, i18n, app loop, bootstrap (composition root)
public/worklets/   the string-synthesis AudioWorklet (plain JS, loaded at runtime)
```

```
presentation ──► application ──► domain ◄── infrastructure      every layer ──► core
                 bootstrap/ wires concrete infrastructure into the ports
```

## Rules

Numbers are cited by `scripts/check-structure.mjs` (letters in brackets) — keep them stable.

1. **One exported declaration per file** — one class, interface, type or const-enum pair. A class
   file exports nothing else. Function/constant collections are fine. [A]
2. **Dependency rule** — imports point inward only. Domain and application never touch browser
   APIs (`window`, `document`, `localStorage`, `AudioContext`, `navigator`) or frameworks; they
   get capabilities through **ports** (`*Interface` in `domain/`), implemented in `infrastructure/`
   and wired only in `presentation/bootstrap/`. Presentation may read `@infrastructure/constants/*`. [B]
3. **`@layer/...` aliases only** — no relative imports in `src/`. [C]
4. **`Result<T, Failure>`, never throw** in domain/application; infrastructure maps exceptions to
   `Failure` at the boundary. Presentation doesn't throw either — the composition root shows an error instead.
5. **Files stay focused** — no source file over 300 lines (locales exempt); entity/use case ~120. [F]
6. **Folders stay scannable** — ≤10 files fine, 11–15 warns, >15 blocks. Group by capability
   (`lessons/catalog`, `lessons/session`), never by kind. `__tests__`/`__fixtures__` exempt. [I]
7. **Keep the map fresh** — after adding, moving or deleting files run `npm run map`. [J]
8. **Ports** — named `XInterface` in `x-interface.ts`; nothing else uses the suffix. [O]
9. **No magic values** — named constants at the top of the file or in a const object; shared
   vocabularies (`PlayMode`, `Grade`, `StrumFilter`) are one const object used everywhere.
10. **English everywhere except locale data** — every file is English; user-visible copy lives in
    `src/presentation/i18n/locales/{en,tr}.ts` with identical keys and placeholders. [T, U]
11. **Booleans read as questions** — `isMuted`, `hasDrums`, `shouldWait`, `canStrum`. (eslint)
12. **No `console.*`** in `src/`. (eslint)
13. **Restrained visuals** — near-black ground, one warm accent (`#e0a458`), hairline borders,
    one type family. Saturated neon reads as cheap to the owner.
14. **Tests** live in `__tests__/` beside the code, are named as sentences, and use hand-written
    fakes of ports (`src/application/__fixtures__/`) instead of mocks. Coverage minimums per layer
    (in `vite.config.ts`) only go up. DOM / Web Audio / camera behaviour is covered by
    [`docs/qa/manual.md`](docs/qa/manual.md).
15. **A bug fix ships the test that would have caught it** — named after the symptom, failing
    without the fix — plus a guard if a gate could catch the class, and a row in
    [`docs/regressions.md`](docs/regressions.md). Proportional: typos need none of this.

## Git flow

> **Open TODO:** Vercel is not connected to GitHub, so pushes don't deploy. Production is deployed by hand
> from `main` (`vercel deploy --prod --yes --scope recepeksi`). Steps to connect: [`docs/deploy.md`](docs/deploy.md).

- `main` is release-only and deploys to production. `dev` is the integration branch and gets a
  Vercel preview. All work branches from `dev`: `feat/…`, `fix/…`, `refactor/…`, `chore/…`.
- Conventional commits (`feat(scope): …`). Every commit ends with the session's Co-Authored-By line.
- Gates must be green before a PR: `npm run check`. The Husky pre-commit hook runs them plus
  `scripts/guard-secrets.mjs`.
- PR → `dev`, squash-merge on green CI. Release = PR `dev → main` with a **merge commit**.
- Skills: [`pr-flow`](.claude/skills/pr-flow/SKILL.md), [`bug-fix`](.claude/skills/bug-fix/SKILL.md),
  [`release`](.claude/skills/release/SKILL.md).

### Stop and ask

- Promoting `dev → main` (a production deploy).
- Dependency major-version bumps; changing the repo's visibility or licence.
- Force-push, history rewrites, deleting work you didn't author.
