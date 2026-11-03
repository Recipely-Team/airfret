---
name: release
description: Promoting Airfret from dev to main (production on Vercel). Use when asked to release, ship to production or promote dev. Needs the owner's explicit go in the conversation.
---

# Release `dev → main`

**Never start without the owner's explicit go.** A push to `main` deploys production.

1. `dev` is green: `npm run check`, `npm run build`, CI green on `dev`.
2. The manual QA pass (`docs/qa/manual.md`) on the `dev` preview URL — at least sections A, B, D.
3. Open the release PR from `dev` itself:
   ```bash
   gh pr create --base main --head dev --title "release: <what a player will notice>" --body "<body>"
   ```
   Body: **What goes out** (in the order a player notices, with PR numbers), **Guards that came
   with it** (new tests, structure rules, regression rows), **State** (gate results, QA result).
4. Merge on green with a **merge commit** (not squash; `dev` stays):
   `if gh pr checks <n> --watch --fail-fast; then gh pr merge <n> --merge; fi`
5. Tag: `git checkout main && git pull && git tag v<x.y.z> && git push origin v<x.y.z>`.
6. Report the PR, merge commit, tag and the production URL.
