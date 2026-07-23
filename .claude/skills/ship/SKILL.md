---
name: ship
description: Build-check, commit, push to GitHub, then deploy to Railway via `railway up`. Use when the user types /ship.
---

# Ship — Push & Deploy to Railway

**Deploys are NOT automatic on push.** This project's Railway services deploy via
the CLI (`railway up`), not a GitHub webhook — a `git push` alone leaves the live
site on the old build. So shipping = the `/git-push` flow **then `railway up` for
each changed service**.
(GitHub Pages deployment is retired — never run `gh-pages`; the app needs the
FastAPI backend and is built with `base: '/'`.)

- Repo root: `d:\Projects_Others\GraduationProject`
- Remote: `origin` → https://github.com/HKHorazon/GraduationProject.git
- Railway project: three services — `frontend` (nginx), `backend` (FastAPI), Postgres plugin
- Deployment details / gotchas: see `DEPLOY.md`

## Steps

### 1. Review + verify (same rules as /git-push)
```bash
cd "d:/Projects_Others/GraduationProject"
git status && git diff        # read the diff, flag secrets/debug leftovers
```
- Frontend changed → `cd frontend && npm run build` must pass.
- Backend changed → `cd backend && .venv/Scripts/python.exe -m compileall -q app` must pass.
- Anything suspicious → STOP and tell the user.

### 2. Commit & push
- Commit message: short imperative summary of the diff (confirm with the user if they gave none), ending with your model's Co-Authored-By line, e.g. `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
```bash
git add -A
git commit -m "<message>"
git push origin master        # keeps GitHub in sync — does NOT deploy. Never force push.
```

### 3. Deploy each changed service (`railway up`)
Only deploy what changed (check the diff paths). Run from the matching subdirectory,
`--ci` so it exits on build success instead of streaming forever:
```bash
# frontend changed:
cd "d:/Projects_Others/GraduationProject/frontend" && railway up --service frontend --ci
# backend changed:
cd "d:/Projects_Others/GraduationProject/backend"  && railway up --service backend  --ci
```
Wait for `Deploy complete`.

### 4. Verify it's actually live (frontend)
`railway up` builds from local files, so the live bundle's hash should match your
`npm run build`. Confirm the change reached production (don't trust "Deploy complete" alone):
```bash
BASE=https://frontend-production-7864.up.railway.app
IDX=$(curl -s $BASE/ | grep -o 'assets/index-[^"]*\.js' | head -1)   # should equal your local dist entry hash
curl -s "$BASE/$IDX" | grep -o 'YourView-[A-Za-z0-9_-]*\.js'         # then curl that chunk and grep for your change
```

### 5. Report
Commit hash + message pushed to `origin/master`, which service(s) `railway up`'d,
and that the live bundle was verified to contain the change.

## Notes
- `railway up` uploads the current directory and builds there — commit/push first so GitHub matches what's live, but the push itself deploys nothing.
- Env vars are managed on Railway (`railway variables`), never committed.
- If a deploy fails with 502 / 405 / nginx emerg, the known causes are catalogued in `DEPLOY.md` §0.
