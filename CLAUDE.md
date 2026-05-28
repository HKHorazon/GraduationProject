# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A graduation project management system for teachers to manage students and project group assignments. Most users can only view; a small number of editors can make changes. Built as a static SPA hosted on GitHub Pages, backed by Supabase.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + Vite |
| Styling | TailwindCSS |
| Backend / DB | Supabase (PostgreSQL) |
| Auth & Permissions | Supabase Auth + Row Level Security (RLS) |
| Hosting | GitHub Pages |

## Project Structure

```
src/
  assets/         # Static assets
  components/     # Reusable Vue components
  composables/    # Vue composables (useAuth, useStudents, etc.)
  lib/            # supabase.js client singleton
  router/         # Vue Router (hash mode for GitHub Pages)
  stores/         # Pinia stores
  views/          # Page-level components
```

## Common Commands

```bash
# Install dependencies
npm install

# Dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## Key Architecture Notes

### Supabase Client
Instantiate the client once in `src/lib/supabase.js` and import it everywhere. Never create multiple instances.

```js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### Environment Variables
Prefix all env vars with `VITE_` so Vite exposes them to the browser. Store in `.env.local` (gitignored). Required vars:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### GitHub Pages Routing
Vue Router must use **hash mode** (`createWebHashHistory`) because GitHub Pages cannot handle SPA fallback routing.

### Auth & Role-Based Access
- Authentication is handled entirely by Supabase Auth
- Roles (editor vs. viewer) are stored as a custom claim or in a `profiles` table
- Access control is enforced at the DB level via RLS policies — do not rely solely on frontend guards

### Permissions Model
- **Viewer** (default): read-only access to students, projects, groups
- **Editor**: can create, update, delete records
- RLS policies enforce this server-side; the frontend shows/hides UI elements based on the user's role

## GitHub Pages Deployment

Build output goes to `dist/`. Deploy using `gh-pages` package:

```bash
npm install -D gh-pages
```

Add to `package.json` scripts:
```json
"deploy": "npm run build && gh-pages -d dist"
```

Set `base` in `vite.config.js` to match the repository name:
```js
base: '/your-repo-name/'
```
