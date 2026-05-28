---
name: ship-local
description: Start the local dev server and display the local URL. Use when the user types /ship-local.
---

# Ship Local

Always start a **new** Vite dev server and show the URL. Do NOT reuse an existing one.

## Steps

1. Run `npm run dev` in background (Vite will auto-pick the next free port if one is already in use)
2. Wait 4 seconds for the server to boot
3. Scan ports 5173–5182 in order, stop at the first that returns HTTP 200
4. Display the URL to the user

## Start Command

```bash
cd "d:\Projects_Other\GraduationProject" && npm run dev 2>&1
```

Run in background.

## Port Check Command (run after waiting)

```bash
for port in 5173 5174 5175 5176 5177 5178 5179 5180 5181 5182; do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/ 2>/dev/null)
  if [ "$code" = "200" ]; then echo "FOUND:$port"; break; fi
done
```

Pick the **highest** port found — that's the newest server.

## Final Message

> Dev server running at **http://localhost:PORT/**
