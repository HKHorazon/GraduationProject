---
name: ship-local
description: Start the local dev server and display the local URL. Use when the user types /ship-local.
---

# Ship Local

Start the Vite dev server for this project and show the local URL.

## Steps

1. Check port 5173 (Vite default), then 5174–5179 in order to find a running dev server
2. If none found, start the dev server in background with `npm run dev`
3. Wait ~3 seconds, then scan ports 5173–5179 again to find the active port
4. Display the URL to the user

## Port Check Command

Run for each port (5173 first, then 5174–5179):
```powershell
try { $r = Invoke-WebRequest -Uri "http://localhost:PORT/" -TimeoutSec 1 -ErrorAction Stop; $r.StatusCode } catch { 0 }
```
Stop at the first port that returns `200`.

## Start Command (if no port active)

```powershell
cd "d:\Projects_Other\GraduationProject"; npm run dev
```
Run in background, then re-scan ports after 3 seconds.

## Final Message

> Dev server is running at **http://localhost:PORT/**
>
> Routes:
> - `/` → 學生列表（純瀏覽，無需登入）
> - `/#/login` → 編輯者登入頁
