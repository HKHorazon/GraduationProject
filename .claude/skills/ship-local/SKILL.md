---
name: ship-local
description: Start the local dev server and display the local URL. Use when the user types /ship-local.
---

# Ship Local

Start the Vite dev server for this project and show the local URL.

## Steps

1. Check if a dev server is already running on port 5173 or 5174
2. If not running, start it with `npm run dev` in the background
3. Wait for it to be ready
4. Display the local URL to the user

## Instructions

Run this Bash command to check if dev server is already up:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5174/ 2>/dev/null || curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ 2>/dev/null
```

If the server is not running (not 200), start it:
```bash
cd "d:\Projects_Other\GraduationProject" && npm run dev 2>&1
```
Run in background, wait ~3 seconds, then read the output to find the port.

Tell the user:
> Dev server is running at **http://localhost:<PORT>/**
