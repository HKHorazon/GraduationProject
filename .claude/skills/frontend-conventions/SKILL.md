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
3. Entry in `PAGES` **and** `DEFAULT_PERMISSIONS` in `src/stores/permissions.js` (zh-TW label; default `{ guest: 'none', viewer: 'none', editor: 'edit' }` unless it is a read-only browse page). Mirror the key in `backend/app/pageperm.py` (`PAGE_KEYS`) and its default levels in `backend/seed.py` (`PAGE_PERMISSIONS`) in the same change — a key missing there is rejected by `PUT /permissions`, and a missing seed row means 不可存取 for everyone (no fallback). A page that is pure action gets `editOnly: true`.
4. Sidebar item in `AppSidebar.vue`, inside the right `SidebarGroup`, gated: `v-if="perms.canAccess('key', auth.role)"`. The view itself opens with `<NoAccess v-if="!perms.canAccess('key', auth.role)" />` (or `!perms.canEdit(...)` for an `editOnly` page).
5. Verify in BOTH themes (dark default + light parchment).

## Hard rules

1. **HTTP**: only through the `api` singleton in `src/lib/api.js`. Never `fetch`/`axios` in views or other files.
2. **Domain data**: only through `useDataStore` (students/groups/teachers). After a mutation, update the array in place — `push`, replace-by-id, or `filter` — exactly like `stores/data.js` does. Never refetch everything after one change.
3. **Permission UX**: everything goes through the permissions store — `perms.canAccess('<page>', auth.role)` for whole-page access, `perms.canEdit('<page>', auth.role)` for write UI. `auth.isAdmin` only for 帳號管理／權限設定. **Never branch on a role string** — `auth.role` holds a group key that a super_admin can rename, delete or invent. This is UX only; the backend guard is the real check.
4. **Names & privacy**: student names render via `<StudentName :student="s" />`, group names via `<GroupName ... />` (`src/components/common/`). They handle logged-out masking (張O明) and editor click-through. Never output a raw student name.
5. **Years**: display via `rocYear()` / `yearClass()` from `src/lib/year.js` (data stores ROC strings like `"113"`).
6. **Icons**: `lucide-vue-next` only. **No new dependencies** — no UI kits, no CSS libs, no date pickers.
7. **Text**: everything the user sees is Traditional Chinese.

## Styling

顏色與排版**不在這份**，各有 binding skill，動手前讀：

- **`web-color`** — 色票、對比度、badge、禁止事項（唯一來源，不要在別處重寫色碼）。
- **`web-display`** — 頁面骨架、間距／字級尺標、表格／表單／彈窗／空狀態、圖示、RWD。
- **`web-excel`** / **`web-docx`** — 檔案產出。

只要記住三件事：`darkMode: 'class'`、深色是預設、優先用 `main.css` 的元件 class
（`.card .input .btn-primary .btn-secondary .btn-danger .label .id-mono`，已內建雙主題）。
Fonts: `font-display` Space Grotesk · `font-sans` DM Sans + Noto Sans TC · `font-mono` Fira Code。
交付前跑 `cd frontend && node scripts/check-colors.mjs`。

## User's UI shorthand

On 學生更動 (`views/changes/RemoveStudentView.vue`): 「左」= search panel (input + result list, `w-96` column); 「右」= action panel (selected-student card + tabs, `flex-1`). Interpret short commands like 「右邊改紅底」 accordingly (see `.claude/memory/ui-naming-convention.md`).

## Verify before done

```powershell
cd d:\Projects_Others\GraduationProject\frontend
npm run build
```

Must pass. For visual changes, run the stack (`/ship-local`), check the page in dark AND light (topbar toggle), logged-out and as editor (`chen` / `password`).
