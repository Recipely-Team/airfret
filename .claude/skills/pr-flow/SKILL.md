---
name: pr-flow
description: Airfret's git flow — branch from dev, run the gates, open a PR to dev, squash-merge on green CI. Use when a change is ready to commit, push, open a PR or merge, or when asked to run the gates. Not for promoting dev to main (use release).
---

# PR flow → `dev`

1. **Branch from `dev`:** `git checkout dev && git pull && git checkout -b <feat|fix|refactor|chore>/<name>`.
   Never commit to `dev` or `main` directly.
2. **Commit** in atomic conventional commits (`feat(player): …`), each ending with the session's
   Co-Authored-By line. Stage files by explicit path, never `git add -A`.
3. **Gates — all green or it isn't done:**
   ```bash
   npm run map      # after adding, moving or deleting files
   npm run check    # lint · typecheck · tests + coverage minimums · check:structure
   npm run build
   ```
   Touching tracking, the player, painters or audio? Also run the relevant rows of `docs/qa/manual.md`.
4. **Push and open the PR:** `git push -u origin <branch>` then
   `gh pr create --base dev --title "<conventional title>" --body "<summary>"`; the body ends with
   `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
5. **Merge only on green:**
   ```bash
   if gh pr checks <n> --watch --fail-fast; then gh pr merge <n> --squash --delete-branch; fi
   git checkout dev && git pull
   ```
   If checks haven't registered yet, wait ~30 s and run the watch again.
6. **Report** the PR number and merged commit. Vercel posts the preview URL on the PR.
