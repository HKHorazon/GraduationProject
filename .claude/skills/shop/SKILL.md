---
name: shop
description: Build the project, commit, and push to GitHub. Displays the GitHub Pages URL when done. Use when the user types /shop.
---

# Shop — Build & Deploy to GitHub

Build the Vue app, commit all changes, push to GitHub, and show the live GitHub Pages URL.

## GitHub Info
- Remote: https://github.com/HKHorazon/GraduationProject.git
- GitHub Pages URL: https://hkhorazon.github.io/GraduationProject/

## Steps

1. Run `npm run build` in `d:\Projects_Other\GraduationProject`
2. If build fails, report the error and stop
3. Stage and commit all changes with a short message (ask the user for a commit message if none provided, or default to "update")
4. Push to GitHub (`git push`)
5. Tell the user the live URL

## Commands

```bash
cd "d:\Projects_Other\GraduationProject"
npm run build
git add -A
git commit -m "<message>"
git push
```

## Final message to user

> Deployed! Live at: **https://hkhorazon.github.io/GraduationProject/**
> (GitHub Pages may take ~1 minute to update)

## Notes
- Do NOT force push
- If git is not initialized, run `git init`, set remote, then push
- If there's nothing to commit, skip the commit step and just push
