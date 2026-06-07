---
name: git-push
description: Review the working changes, then commit and push to GitHub. Use when the user types /git-push.
---

# Git Push — Review, Commit, Push

Review the current changes, commit them, and push to GitHub. No GitHub Pages /
no build deploy — this only pushes source to the remote.

- Repo root: `d:\Projects_Others\GraduationProject`
- Remote: `origin` → https://github.com/HKHorazon/GraduationProject.git
- Default branch: `master`

## Steps

### 1. Review the changes
- Show what will be committed:
  ```bash
  cd "d:/Projects_Others/GraduationProject"
  git status
  git diff --stat
  git diff            # actually read the diff, don't skim
  ```
- Sanity checks (only run the ones relevant to what changed):
  - Frontend changed → `cd frontend && npm run build` (must succeed)
  - Backend changed → `cd backend && .venv/Scripts/python.exe -m compileall -q app`
- Self-review the diff and flag before committing:
  - secrets / real passwords / tokens / `.env` values accidentally staged
  - leftover debug prints, `console.log`, commented-out blocks, `TODO/FIXME`
  - large or unintended files (build output, `*.db`, `node_modules`, `.venv`)
  - anything that contradicts the stated intent of the change
- If anything looks wrong, STOP and tell the user; don't commit.

### 2. Commit
- Ask the user for a commit message. If they don't give one, propose a short
  imperative summary derived from the diff and confirm it.
- Stage and commit:
  ```bash
  git add -A
  git commit -m "<message>"
  ```
- The commit message MUST end with:
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  ```
- Never use `--no-verify` or skip hooks. If a hook fails, fix the cause.

### 3. Push
```bash
git push origin master
```
- If the branch is not `master`, push the current branch instead.
- Do NOT force push.
- If the remote rejects (non-fast-forward), STOP and tell the user to pull/merge
  first — do not force.

### 4. Report
Tell the user: the commit hash + message, and that it's pushed to `origin/<branch>`.

## Notes
- This pushes source only. Deployment is separate (`docker compose up` on the server).
- `.gitignore` already excludes `node_modules/`, `dist/`, `.venv/`, `*.db`, `.env` —
  if any of those show up staged, something is wrong; investigate before committing.
