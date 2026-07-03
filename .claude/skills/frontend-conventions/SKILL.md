---
name: frontend-conventions
description: Vue 3 frontend conventions — page checklist, store/data rules, dual-theme design tokens. MUST be read before adding or modifying any view, component, store, or UI styling in frontend/. Guarantees identical output across models (Fable/Opus/Sonnet).
---

# Frontend Conventions

Reference implementations — when unsure, copy from these, never invent:
- List page (filters + sortable table): `frontend/src/views/StudentsView.vue`
- Store mutations: `frontend/src/stores/data.js`
- Form → preview → execute flow: `frontend/src/views/DocumentsView.vue`
- Sidebar gating: `frontend/src/components/layout/AppSidebar.vue`

## New page checklist (ALL 5 touchpoints, every time)

1. View in `src/views/` — `<script setup>`, template wrapped in `<AppLayout>`, `onMounted(() => data.loadAll())` if it shows domain data.
2. Lazy route in `src/router/index.js`: `{ path, name, component: () => import('@/views/XView.vue') }`.
3. Entry in `PAGES` **and** `DEFAULT_PERMISSIONS` in `src/stores/permissions.js` (zh-TW label; default viewer:false editor:true unless read-only browse page).
4. Sidebar item in `AppSidebar.vue`, inside the right `SidebarGroup`, gated: `v-if="perms.canAccess('key', auth.role)"`.
5. Verify in BOTH themes (dark default + light parchment).

## Hard rules

1. **HTTP**: only through the `api` singleton in `src/lib/api.js`. Never `fetch`/`axios` in views or other files.
2. **Domain data**: only through `useDataStore` (students/groups/teachers). After a mutation, update the array in place — `push`, replace-by-id, or `filter` — exactly like `stores/data.js` does. Never refetch everything after one change.
3. **Permission UX**: hide write UI with `auth.isEditor` / `auth.isSuperAdmin`; page access via permissions store. This is UX only — the backend guard is the real check.
4. **Names & privacy**: student names render via `<StudentName :student="s" />`, group names via `<GroupName ... />` (`src/components/common/`). They handle logged-out masking (張O明) and editor click-through. Never output a raw student name.
5. **Years**: display via `rocYear()` / `yearClass()` from `src/lib/year.js` (data stores ROC strings like `"113"`).
6. **Icons**: `lucide-vue-next` only. **No new dependencies** — no UI kits, no CSS libs, no date pickers.
7. **Text**: everything the user sees is Traditional Chinese.

## Styling (dual theme, non-negotiable)

`darkMode: 'class'`; dark is the DEFAULT. Light mode is a warm parchment theme, largely driven by global overrides in `src/assets/main.css` — so:

- Prefer the shared component classes: `.card` `.input` `.btn-primary` `.btn-secondary` `.btn-danger` `.label` `.id-mono` (defined in `main.css`, already theme-aware).
- Otherwise write standard light-mode Tailwind (`bg-white`, `border-slate-200`, `text-slate-800`) + `dark:` variants with the Dark Tech tokens. `main.css` remaps the light utilities to parchment automatically.
- Never hardcode one theme into a page (RemoveStudentView did this and needed a `.stu-change` override block — don't repeat that).

Tokens (from `tailwind.config.js` / `main.css`):

| Token | Dark (default) | Light (parchment) |
|---|---|---|
| page bg | `#0f1117` (`dark-bg`) | `#ece3cf` |
| sidebar/section | `#161b27` (`dark-sidebar`) | `#f7f1e1` |
| card | `#1e2535` (`dark-card`) | `#f7f1e1` |
| border | `#2a3347` (`dark-border`) | `#ddd0b3` |
| accent | `#00d4ff` (`accent`) | `#00b3d8`, text `#0e7490` |

Fonts: `font-display` Space Grotesk · `font-sans` DM Sans + Noto Sans TC · `font-mono` Fira Code.
Table headers: `text-[10px] font-mono uppercase tracking-widest text-slate-500`.
Badges: 已分組 `border-cyan-500/40 bg-cyan-400/10 text-cyan-400` · 未分組 `border-slate-700 bg-dark-border/50 text-slate-500` · INACTIVE `border-amber-700/50 bg-amber-900/20 text-amber-500`.

## User's UI shorthand

On 學生更動 (`views/changes/RemoveStudentView.vue`): 「左」= search panel (input + result list, `w-96` column); 「右」= action panel (selected-student card + tabs, `flex-1`). Interpret short commands like 「右邊改紅底」 accordingly (see `.claude/memory/ui-naming-convention.md`).

## Verify before done

```powershell
cd d:\Projects_Others\GraduationProject\frontend
npm run build
```

Must pass. For visual changes, run the stack (`/ship-local`), check the page in dark AND light (topbar toggle), logged-out and as editor (`chen` / `password`).
