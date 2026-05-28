---
name: ship
description: Build the project, commit, and push to GitHub. Displays the GitHub Pages URL when done. Use when the user types /ship.
---

# Ship — Build & Deploy to GitHub

Build the Vue app, commit all changes, push to GitHub, and show the live GitHub Pages URL.

## GitHub Info
- Remote: https://github.com/HKHorazon/GraduationProject.git
- GitHub Pages URL: https://hkhorazon.github.io/GraduationProject/

## Steps

1. Run `npm run build` in `d:\Projects_Other\GraduationProject`
2. If build fails, report the error and stop
3. Ask the user for a commit message (or default to "update" if they don't provide one)
4. Stage all changes and commit
5. Push to GitHub (`git push`)
6. Tell the user the live URL

## Commands

```powershell
cd "d:\Projects_Other\GraduationProject"
npm run build
git add -A
git commit -m "<message>"
git push
```

## Final message to user

> Deployed! Live at: **https://hkhorazon.github.io/GraduationProject/**
> (GitHub Pages may take ~1 minute to update)
>
> Routes:
> - `/#/` → 學生列表（純瀏覽，無需登入）
> - `/#/login` → 編輯者登入頁

## Notes
- Do NOT force push
- If there's nothing to commit, skip the commit step and just push
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env.local` before building
