# Deploying

Live: **https://airfret.vercel.app** (Vercel project `airfret`, team `recepeksi`).

## ⚠️ TODO — automatic deploys are not connected yet

Pushes to GitHub do **not** deploy. Vercel's GitHub app has no access to `Recipely-Team/airfret`
(the repo moved from `recepteksi` to the organisation). Until this is done, production is deployed by hand.

To connect:

1. GitHub → **Recipely-Team** → Settings → GitHub Apps → **Vercel** → Configure → add `airfret` to repository access.
2. From the repo: `vercel git connect --yes --scope recepeksi`
3. In Vercel → Project → Settings → Git: production branch **main**; `dev` gets preview deployments.
4. Check: push to `dev` → a preview URL appears on the PR; merging a release to `main` → production updates.
5. Delete this TODO section.

Tracked in the GitHub issue "Connect Vercel to GitHub for automatic deploys".

## Manual deploy (until then)

```bash
git checkout main && git pull
vercel deploy --prod --yes --scope recepeksi      # production
git checkout dev && vercel deploy --yes --scope recepeksi   # preview (behind Vercel login)
```

Only deploy production from `main`, after the release PR (`dev → main`) is merged and tagged — see the
`release` skill.
