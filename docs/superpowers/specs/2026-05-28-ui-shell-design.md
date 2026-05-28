# UI Shell Design — Phase 1

## Overview

Single-layout SPA with collapsible sidebar, role-based menu visibility, dark/light mode toggle, and tech/gaming aesthetic. Built with Vue 3 + TailwindCSS.

## Layout

```
┌─────────────────────────────────────────────┐
│ [≡] Logo          [🌙/☀️ toggle]  [User]   │  ← Topbar
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │  <router-view>                   │
│          │                                  │
│ [icon]   │                                  │
│  瀏覽 ▾  │                                  │
│   學生   │                                  │
│   組別   │                                  │
│          │                                  │
│ [icon]   │                                  │
│  異動 ▾  │                                  │
│   移除   │                                  │
│   學生   │                                  │
│          │                                  │
│ [icon]   │                                  │
│  資料 ▾  │  (placeholder)                   │
│          │                                  │
│ [icon]   │                                  │
│  帳號 ▾  │  (placeholder)                   │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

## Sidebar Behaviour

- Default: expanded (shows icons + text)
- Collapsed: icons only, hover tooltip shows label
- Each category group is independently collapsible (accordion-style)
- Active route is highlighted
- Sidebar state persisted to localStorage

## Role-Based Visibility

Sidebar items are filtered by the user's role. Roles and permissions are managed by super admin (Phase 3). For Phase 1, hardcode viewer/editor rules:

| Item | Viewer | Editor |
|------|--------|--------|
| 學生列表 | ✅ | ✅ |
| 組別列表 | ✅ | ✅ |
| 移除學生出組 | ❌ | ✅ |
| 資料（佔位） | ❌ | ✅ |
| 帳號（佔位） | ❌ | ✅ |

## Visual Style

- Tech/gaming aesthetic: sharp edges, glowing accent colours, monospace font for IDs
- Dark mode: near-black background (`#0f1117`), sidebar slightly lighter (`#161b27`)
- Light mode: white content area, light grey sidebar
- Accent: electric blue / cyan (`#00d4ff`) for active states and highlights
- Sidebar uses subtle border-right glow in dark mode
- Smooth transitions on collapse / mode toggle (150ms ease)

## Dark/Light Mode

- Toggle button in topbar
- Preference stored in localStorage
- Implemented via TailwindCSS `class` dark mode strategy (`darkMode: 'class'` in tailwind.config.js)

## Mock Data

Stored as static JS files in `src/data/`:

- `teachers.js` — 5 teachers
- `students.js` — 30 students across 3 school years
- `groups.js` — 8 groups with group_teachers assignments

## Routes (Phase 1)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | redirect → `/students` | |
| `/students` | StudentsView | 學生列表 |
| `/groups` | GroupsView | 組別列表 |
| `/changes/remove-student` | RemoveStudentView | 移除學生出組 |
| `/data` | DataView | 佔位頁 |
| `/accounts` | AccountsView | 佔位頁 |

## Components

```
src/
  components/
    layout/
      AppLayout.vue        ← root layout wrapper
      AppSidebar.vue       ← sidebar with groups + collapse
      AppTopbar.vue        ← topbar with toggle + user
      SidebarGroup.vue     ← collapsible group
      SidebarItem.vue      ← single nav item
  data/
    teachers.js
    students.js
    groups.js
  views/
    StudentsView.vue
    GroupsView.vue
    changes/
      RemoveStudentView.vue
    DataView.vue
    AccountsView.vue
```

## Out of Scope (Phase 1)

- Supabase integration (use mock data)
- Real auth (simulate role via store)
- Permission management UI
- 改動記錄 page
- 資料 / 帳號 full implementation
