---
name: ship
description: Build-check, commit, push to GitHub — Railway auto-deploys from master. Use when the user types /ship.
---

# Ship — Push & Deploy to Railway

Railway is linked to the GitHub repo: **pushing to `master` triggers the deploy**.
So shipping = the `/git-push` flow, then confirm Railway picked it up.
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
git push origin master        # this IS the deploy trigger — never force push
```

### 3. Confirm the deploy
- If the Railway CLI is available and linked (`railway status`):
  ```bash
  railway logs --service backend    # watch for "Application startup complete"
  railway logs --service frontend
  ```
- Otherwise tell the user to check the Railway dashboard — builds take a few minutes.

### 4. Report
Commit hash + message, pushed to `origin/master`, and that Railway is redeploying
(frontend + backend rebuild from their Root Directories).

## Notes
- Manual/instant deploy without a push: `railway up --service backend|frontend` from the matching subdirectory.
- Env vars are managed on Railway (`railway variables`), never committed.
- If a deploy fails with 502 / 405 / nginx emerg, the known causes are catalogued in `DEPLOY.md` §0.
