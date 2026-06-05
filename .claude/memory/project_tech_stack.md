---
name: project-tech-stack
description: Tech stack and deployment decisions for the graduation project management system
metadata:
  type: project
---

Vue 3 + Vite frontend, Supabase (PostgreSQL + Auth + RLS) as backend/DB, deployed on GitHub Pages.

**Why:** User wanted a free, simple backend with auth and role-based permissions. Supabase was chosen over Firebase because the relational data model (students/groups/projects) fits PostgreSQL better, and Supabase Auth + RLS handles viewer/editor permissions cleanly without a custom API.

**How to apply:** Always use hash mode router for GitHub Pages compatibility. All env vars must be prefixed with VITE_. RLS is the source of truth for permissions — frontend guards are UI only.

Key constraints:
- GitHub Pages = static only, no SSR
- Supabase free tier: pauses after 7 days inactivity (acceptable since teachers use it regularly)
- Role model: viewer (read-only, default) vs editor (full CRUD)
- Scale: 50–300 students
