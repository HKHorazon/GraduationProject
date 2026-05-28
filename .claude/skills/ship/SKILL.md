---
name: ship
description: Build the project, commit, push source to GitHub, and deploy to GitHub Pages. Use when the user types /ship.
---

# Ship — Build & Deploy to GitHub Pages

Build the Vue app, commit source changes, push to GitHub, then deploy built files to GitHub Pages.

## GitHub Info
- Remote: https://github.com/HKHorazon/GraduationProject.git
- GitHub Pages URL: https://hkhorazon.github.io/GraduationProject/

## Steps

1. Ask the user for a commit message (or use "update" as default)
2. Stage all source changes and commit
3. Push source to GitHub (`git push`)
4. Run `npm run deploy` to build and push `dist/` to the `gh-pages` branch
5. If any step fails, report the error and stop
6. Tell the user the live URL

## Commands

```bash
cd "d:\Projects_Other\GraduationProject"
git add -A
git commit -m "<message>"
git push
npm run deploy
```

## Final message to user

> Deployed! Live at: **https://hkhorazon.github.io/GraduationProject/**
> (GitHub Pages may take ~1 minute to update)

## Notes
- Do NOT force push
- If there's nothing to commit, skip the commit step and just run `npm run deploy`
- `npm run deploy` = `npm run build && gh-pages -d dist` (deploys to gh-pages branch)
