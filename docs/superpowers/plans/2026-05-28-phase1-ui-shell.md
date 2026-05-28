# Phase 1 UI Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a collapsible sidebar layout with dark/light mode, role-based nav, mock data, and core browse/change views.

**Architecture:** Single `AppLayout.vue` wraps all pages; `AppSidebar.vue` renders role-filtered nav groups; theme and auth state live in Pinia stores backed by localStorage. All data comes from static JS mock files — no Supabase calls in Phase 1.

**Tech Stack:** Vue 3 (Composition API), TailwindCSS (class dark mode), Pinia, Vue Router (hash mode)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `tailwind.config.js` | Modify | Add `darkMode: 'class'`, custom colours |
| `src/assets/main.css` | Modify | Dark mode scrollbar, CSS custom properties |
| `src/data/teachers.js` | Create | 5 mock teachers |
| `src/data/students.js` | Create | 30 mock students |
| `src/data/groups.js` | Create | 8 mock groups with teacher assignments |
| `src/stores/theme.js` | Create | Dark/light mode toggle, localStorage |
| `src/stores/auth.js` | Modify | Add `mockRole` dev toggle, remove Supabase dependency |
| `src/components/layout/SidebarItem.vue` | Create | Single nav item (icon + label + active state) |
| `src/components/layout/SidebarGroup.vue` | Create | Collapsible nav group |
| `src/components/layout/AppSidebar.vue` | Create | Full sidebar with collapse + nav groups |
| `src/components/layout/AppTopbar.vue` | Create | Topbar: logo, dark toggle, user chip |
| `src/components/layout/AppLayout.vue` | Create | Root layout wrapper |
| `src/router/index.js` | Modify | Replace routes with Phase 1 routes |
| `src/views/StudentsView.vue` | Create | Student list table with search |
| `src/views/GroupsView.vue` | Create | Group cards with member list |
| `src/views/changes/RemoveStudentView.vue` | Create | Select group → select student → confirm remove |
| `src/views/DataView.vue` | Create | Placeholder page |
| `src/views/AccountsView.vue` | Create | Placeholder page |

---

## Task 1: Tailwind Config — Dark Mode + Custom Colours

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: Update tailwind.config.js**

Replace the entire file content:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans TC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        accent: {
          DEFAULT: '#00d4ff',
          dim: '#0099bb',
          glow: 'rgba(0,212,255,0.15)',
        },
        dark: {
          bg: '#0f1117',
          sidebar: '#161b27',
          card: '#1e2535',
          border: '#2a3347',
          muted: '#4a5568',
        },
      },
      boxShadow: {
        'accent-glow': '0 0 12px rgba(0,212,255,0.25)',
        'sidebar-glow': 'inset -1px 0 0 rgba(0,212,255,0.1)',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Commit**

```bash
git add tailwind.config.js
git commit -m "feat: add darkMode class strategy and custom tech/gaming colours"
```

---

## Task 2: CSS — Dark Mode Scrollbar + Custom Properties

**Files:**
- Modify: `src/assets/main.css`

- [ ] **Step 1: Update main.css**

Replace the entire file content:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }

body {
  font-family: 'Noto Sans TC', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Scrollbar — light */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: #f1f5f9; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* Scrollbar — dark */
.dark ::-webkit-scrollbar-track { background: #161b27; }
.dark ::-webkit-scrollbar-thumb { background: #2a3347; }
.dark ::-webkit-scrollbar-thumb:hover { background: #4a5568; }

@layer components {
  /* Cards */
  .card {
    @apply bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border shadow-sm;
  }

  /* Buttons */
  .btn-primary {
    @apply bg-accent hover:bg-accent-dim text-dark-bg font-semibold px-4 py-2 rounded-lg transition-all text-sm shadow-accent-glow;
  }
  .btn-secondary {
    @apply bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-dark-border text-slate-700 dark:text-slate-300 font-medium px-4 py-2 rounded-lg border border-slate-200 dark:border-dark-border transition-colors text-sm;
  }
  .btn-danger {
    @apply bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm;
  }

  /* Form inputs */
  .input {
    @apply w-full border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition;
  }
  .label {
    @apply block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1;
  }

  /* Monospace ID display */
  .id-mono {
    @apply font-mono text-xs text-accent tracking-wide;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/assets/main.css
git commit -m "feat: dark mode scrollbar and updated component classes"
```

---

## Task 3: Mock Data

**Files:**
- Create: `src/data/teachers.js`
- Create: `src/data/students.js`
- Create: `src/data/groups.js`

- [ ] **Step 1: Create src/data/teachers.js**

```js
export const teachers = [
  { id: 't1', name: '陳志明', user_id: null },
  { id: 't2', name: '林美華', user_id: null },
  { id: 't3', name: '黃建國', user_id: null },
  { id: 't4', name: '劉雅婷', user_id: null },
  { id: 't5', name: '張文傑', user_id: null },
]
```

- [ ] **Step 2: Create src/data/groups.js**

```js
export const groups = [
  { id: 'g1', number: 1, name: '智慧校園導覽系統', school_year: '2024-2025', teacher_ids: ['t1'] },
  { id: 'g2', number: 2, name: '環保能源監測平台', school_year: '2024-2025', teacher_ids: ['t2'] },
  { id: 'g3', number: 3, name: 'AI 作業批改助手', school_year: '2024-2025', teacher_ids: ['t1', 't3'] },
  { id: 'g4', number: 4, name: '圖書館借還書自動化', school_year: '2024-2025', teacher_ids: ['t4'] },
  { id: 'g5', number: 1, name: '健康管理 APP', school_year: '2023-2024', teacher_ids: ['t2'] },
  { id: 'g6', number: 2, name: '校園失物招領平台', school_year: '2023-2024', teacher_ids: ['t5'] },
  { id: 'g7', number: 3, name: '線上選修課系統', school_year: '2023-2024', teacher_ids: ['t3'] },
  { id: 'g8', number: 4, name: '宿舍管理系統', school_year: '2023-2024', teacher_ids: ['t4', 't5'] },
]
```

- [ ] **Step 3: Create src/data/students.js**

```js
export const students = [
  // 2024-2025 — Group g1
  { id: 's01', student_id: 'A11001', name: '王大明', class: '三甲', school_year: '2024-2025', group_id: 'g1' },
  { id: 's02', student_id: 'A11002', name: '李小花', class: '三甲', school_year: '2024-2025', group_id: 'g1' },
  { id: 's03', student_id: 'A11003', name: '張偉豪', class: '三乙', school_year: '2024-2025', group_id: 'g1' },
  // 2024-2025 — Group g2
  { id: 's04', student_id: 'A11004', name: '陳雅琪', class: '三乙', school_year: '2024-2025', group_id: 'g2' },
  { id: 's05', student_id: 'A11005', name: '劉志遠', class: '三丙', school_year: '2024-2025', group_id: 'g2' },
  { id: 's06', student_id: 'A11006', name: '林佳穎', class: '三丙', school_year: '2024-2025', group_id: 'g2' },
  // 2024-2025 — Group g3
  { id: 's07', student_id: 'A11007', name: '黃俊傑', class: '三甲', school_year: '2024-2025', group_id: 'g3' },
  { id: 's08', student_id: 'A11008', name: '吳思穎', class: '三乙', school_year: '2024-2025', group_id: 'g3' },
  { id: 's09', student_id: 'A11009', name: '鄭家豪', class: '三丙', school_year: '2024-2025', group_id: 'g3' },
  // 2024-2025 — Group g4
  { id: 's10', student_id: 'A11010', name: '許美玲', class: '三甲', school_year: '2024-2025', group_id: 'g4' },
  { id: 's11', student_id: 'A11011', name: '蔡宗翰', class: '三乙', school_year: '2024-2025', group_id: 'g4' },
  // 2024-2025 — Unassigned
  { id: 's12', student_id: 'A11012', name: '周靜文', class: '三丙', school_year: '2024-2025', group_id: null },

  // 2023-2024 — Group g5
  { id: 's13', student_id: 'A10001', name: '謝志豪', class: '三甲', school_year: '2023-2024', group_id: 'g5' },
  { id: 's14', student_id: 'A10002', name: '江淑惠', class: '三甲', school_year: '2023-2024', group_id: 'g5' },
  { id: 's15', student_id: 'A10003', name: '余建志', class: '三乙', school_year: '2023-2024', group_id: 'g5' },
  // 2023-2024 — Group g6
  { id: 's16', student_id: 'A10004', name: '潘曉雯', class: '三乙', school_year: '2023-2024', group_id: 'g6' },
  { id: 's17', student_id: 'A10005', name: '魏志強', class: '三丙', school_year: '2023-2024', group_id: 'g6' },
  { id: 's18', student_id: 'A10006', name: '唐雅萍', class: '三丙', school_year: '2023-2024', group_id: 'g6' },
  // 2023-2024 — Group g7
  { id: 's19', student_id: 'A10007', name: '盧冠廷', class: '三甲', school_year: '2023-2024', group_id: 'g7' },
  { id: 's20', student_id: 'A10008', name: '石怡君', class: '三乙', school_year: '2023-2024', group_id: 'g7' },
  { id: 's21', student_id: 'A10009', name: '何思賢', class: '三丙', school_year: '2023-2024', group_id: 'g7' },
  // 2023-2024 — Group g8
  { id: 's22', student_id: 'A10010', name: '倪靜怡', class: '三甲', school_year: '2023-2024', group_id: 'g8' },
  { id: 's23', student_id: 'A10011', name: '翁育誠', class: '三乙', school_year: '2023-2024', group_id: 'g8' },
  // 2023-2024 — Unassigned
  { id: 's24', student_id: 'A10012', name: '方建中', class: '三丙', school_year: '2023-2024', group_id: null },

  // 2025-2026 — Unassigned (new intake)
  { id: 's25', student_id: 'A12001', name: '蘇品妤', class: '三甲', school_year: '2025-2026', group_id: null },
  { id: 's26', student_id: 'A12002', name: '馮啟明', class: '三甲', school_year: '2025-2026', group_id: null },
  { id: 's27', student_id: 'A12003', name: '葉雅惠', class: '三乙', school_year: '2025-2026', group_id: null },
  { id: 's28', student_id: 'A12004', name: '程志偉', class: '三乙', school_year: '2025-2026', group_id: null },
  { id: 's29', student_id: 'A12005', name: '鍾美華', class: '三丙', school_year: '2025-2026', group_id: null },
  { id: 's30', student_id: 'A12006', name: '洪建宏', class: '三丙', school_year: '2025-2026', group_id: null },
]
```

- [ ] **Step 4: Commit**

```bash
git add src/data/
git commit -m "feat: add mock data for teachers, students, groups"
```

---

## Task 4: Theme Store

**Files:**
- Create: `src/stores/theme.js`

- [ ] **Step 1: Create src/stores/theme.js**

```js
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem('theme') === 'dark')

  function apply() {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  function toggle() {
    isDark.value = !isDark.value
  }

  watch(isDark, (val) => {
    localStorage.setItem('theme', val ? 'dark' : 'light')
    apply()
  })

  apply()

  return { isDark, toggle }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/theme.js
git commit -m "feat: theme store with dark/light toggle and localStorage persistence"
```

---

## Task 5: Auth Store — Mock Role

**Files:**
- Modify: `src/stores/auth.js`

- [ ] **Step 1: Replace src/stores/auth.js**

```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

// DEV: change to 'viewer' to test viewer perspective
const DEV_MOCK_ROLE = 'editor'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const role = ref(DEV_MOCK_ROLE)

  const isLoggedIn = computed(() => true) // mock: always logged in
  const isEditor = computed(() => role.value === 'editor')
  const isSuperAdmin = computed(() => role.value === 'super_admin')

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      user.value = session.user
      role.value = session.user.user_metadata?.role ?? DEV_MOCK_ROLE
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
      role.value = session?.user?.user_metadata?.role ?? DEV_MOCK_ROLE
    })
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    role.value = data.user.user_metadata?.role ?? 'viewer'
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    role.value = DEV_MOCK_ROLE
  }

  return { user, role, isLoggedIn, isEditor, isSuperAdmin, init, signIn, signOut }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/auth.js
git commit -m "feat: mock role in auth store for Phase 1 development"
```

---

## Task 6: SidebarItem Component

**Files:**
- Create: `src/components/layout/SidebarItem.vue`

- [ ] **Step 1: Create src/components/layout/SidebarItem.vue**

```vue
<template>
  <RouterLink
    :to="to"
    class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group relative"
    :class="isActive
      ? 'bg-accent-glow text-accent font-semibold border border-accent/20'
      : 'text-slate-400 hover:text-slate-200 hover:bg-dark-border/50'"
  >
    <span class="text-base flex-shrink-0" :class="isActive ? 'text-accent' : ''">{{ icon }}</span>

    <span
      class="truncate transition-all duration-150"
      :class="collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'"
    >{{ label }}</span>

    <!-- Tooltip when collapsed -->
    <span
      v-if="collapsed"
      class="absolute left-full ml-2 px-2 py-1 bg-dark-card border border-dark-border rounded text-xs text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
    >{{ label }}</span>

    <!-- Active glow bar -->
    <span
      v-if="isActive"
      class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-accent rounded-full shadow-accent-glow"
    />
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  to: { type: String, required: true },
  label: { type: String, required: true },
  icon: { type: String, required: true },
  collapsed: { type: Boolean, default: false },
})

const route = useRoute()
const isActive = computed(() => route.path === props.to || route.path.startsWith(props.to + '/'))
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/SidebarItem.vue
git commit -m "feat: SidebarItem component with active state and collapse tooltip"
```

---

## Task 7: SidebarGroup Component

**Files:**
- Create: `src/components/layout/SidebarGroup.vue`

- [ ] **Step 1: Create src/components/layout/SidebarGroup.vue**

```vue
<template>
  <div class="mb-1">
    <!-- Group header -->
    <button
      @click="toggle"
      class="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors rounded-lg hover:bg-dark-border/30"
    >
      <span class="text-base flex-shrink-0">{{ icon }}</span>
      <span
        class="flex-1 text-left transition-all duration-150"
        :class="collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'"
      >{{ label }}</span>
      <span
        v-if="!collapsed"
        class="text-slate-600 transition-transform duration-200"
        :class="open ? 'rotate-0' : '-rotate-90'"
      >▾</span>
    </button>

    <!-- Items -->
    <div
      class="overflow-hidden transition-all duration-200"
      :class="open || collapsed ? 'max-h-96' : 'max-h-0'"
    >
      <div class="pl-2 mt-0.5 flex flex-col gap-0.5">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  label: { type: String, required: true },
  icon: { type: String, required: true },
  collapsed: { type: Boolean, default: false },
})

const open = ref(true)
function toggle() { open.value = !open.value }
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/SidebarGroup.vue
git commit -m "feat: SidebarGroup collapsible nav group component"
```

---

## Task 8: AppSidebar Component

**Files:**
- Create: `src/components/layout/AppSidebar.vue`

- [ ] **Step 1: Create src/components/layout/AppSidebar.vue**

```vue
<template>
  <aside
    class="flex flex-col bg-dark-sidebar border-r border-dark-border shadow-sidebar-glow transition-all duration-150 flex-shrink-0"
    :class="collapsed ? 'w-14' : 'w-56'"
  >
    <!-- Logo row -->
    <div class="flex items-center gap-3 px-3 h-14 border-b border-dark-border">
      <span class="text-xl">🎓</span>
      <span
        class="font-bold text-accent text-sm tracking-wide transition-all duration-150"
        :class="collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'"
      >畢業專題</span>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1">
      <!-- 瀏覽 -->
      <SidebarGroup label="瀏覽" icon="🔍" :collapsed="collapsed">
        <SidebarItem to="/students" label="學生列表" icon="👥" :collapsed="collapsed" />
        <SidebarItem to="/groups" label="組別列表" icon="📋" :collapsed="collapsed" />
      </SidebarGroup>

      <!-- 異動 — editor only -->
      <SidebarGroup v-if="isEditor" label="異動" icon="🔄" :collapsed="collapsed">
        <SidebarItem to="/changes/remove-student" label="移除學生出組" icon="➖" :collapsed="collapsed" />
      </SidebarGroup>

      <!-- 資料 — editor only -->
      <SidebarGroup v-if="isEditor" label="資料" icon="🗄️" :collapsed="collapsed">
        <SidebarItem to="/data" label="資料管理" icon="📁" :collapsed="collapsed" />
      </SidebarGroup>

      <!-- 帳號 — editor only -->
      <SidebarGroup v-if="isEditor" label="帳號" icon="👤" :collapsed="collapsed">
        <SidebarItem to="/accounts" label="帳號管理" icon="⚙️" :collapsed="collapsed" />
      </SidebarGroup>
    </nav>

    <!-- Collapse toggle -->
    <button
      @click="toggleCollapse"
      class="flex items-center justify-center h-10 border-t border-dark-border text-slate-500 hover:text-accent transition-colors text-sm"
    >
      {{ collapsed ? '▶' : '◀' }}
    </button>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import SidebarGroup from './SidebarGroup.vue'
import SidebarItem from './SidebarItem.vue'

const auth = useAuthStore()
const isEditor = auth.isEditor

const collapsed = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('sidebar-collapsed')
  if (saved !== null) collapsed.value = saved === 'true'
})

function toggleCollapse() {
  collapsed.value = !collapsed.value
  localStorage.setItem('sidebar-collapsed', collapsed.value)
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/AppSidebar.vue
git commit -m "feat: AppSidebar with collapsible groups, role-based items, localStorage"
```

---

## Task 9: AppTopbar Component

**Files:**
- Create: `src/components/layout/AppTopbar.vue`

- [ ] **Step 1: Create src/components/layout/AppTopbar.vue**

```vue
<template>
  <header class="flex items-center justify-between h-14 px-6 bg-dark-sidebar border-b border-dark-border flex-shrink-0">
    <!-- Left: page title -->
    <h1 class="text-slate-200 text-sm font-semibold tracking-wide">{{ pageTitle }}</h1>

    <!-- Right: controls -->
    <div class="flex items-center gap-3">
      <!-- Dark mode toggle -->
      <button
        @click="theme.toggle()"
        class="w-8 h-8 rounded-lg bg-dark-card border border-dark-border flex items-center justify-center text-sm hover:border-accent/40 transition-colors"
        :title="theme.isDark ? '切換淺色模式' : '切換深色模式'"
      >
        {{ theme.isDark ? '☀️' : '🌙' }}
      </button>

      <!-- User chip -->
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
        <span class="w-2 h-2 rounded-full bg-accent shadow-accent-glow"></span>
        <span class="text-xs text-slate-300 font-mono">{{ roleLabel }}</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'

const theme = useThemeStore()
const auth = useAuthStore()
const route = useRoute()

const pageTitles = {
  '/students': '學生列表',
  '/groups': '組別列表',
  '/changes/remove-student': '移除學生出組',
  '/data': '資料管理',
  '/accounts': '帳號管理',
}

const pageTitle = computed(() => pageTitles[route.path] ?? '畢業專題管理系統')
const roleLabel = computed(() => {
  const map = { super_admin: 'SUPER ADMIN', editor: 'EDITOR', viewer: 'VIEWER' }
  return map[auth.role] ?? auth.role.toUpperCase()
})
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/AppTopbar.vue
git commit -m "feat: AppTopbar with dark mode toggle, role chip, page title"
```

---

## Task 10: AppLayout Component

**Files:**
- Create: `src/components/layout/AppLayout.vue`
- Modify: `src/App.vue`

- [ ] **Step 1: Create src/components/layout/AppLayout.vue**

```vue
<template>
  <div class="flex h-screen bg-dark-bg text-slate-200 overflow-hidden">
    <AppSidebar />
    <div class="flex flex-col flex-1 min-w-0">
      <AppTopbar />
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
</script>
```

- [ ] **Step 2: Update src/App.vue to apply dark class and use layout**

```vue
<template>
  <router-view />
</template>
```

App.vue stays as is — the layout is applied per-view (see Task 11).

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/AppLayout.vue
git commit -m "feat: AppLayout root layout wrapper"
```

---

## Task 11: Router Update

**Files:**
- Modify: `src/router/index.js`

- [ ] **Step 1: Replace src/router/index.js**

```js
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/students' },
  { path: '/students', name: 'Students', component: () => import('@/views/StudentsView.vue') },
  { path: '/groups', name: 'Groups', component: () => import('@/views/GroupsView.vue') },
  { path: '/changes/remove-student', name: 'RemoveStudent', component: () => import('@/views/changes/RemoveStudentView.vue') },
  { path: '/data', name: 'Data', component: () => import('@/views/DataView.vue') },
  { path: '/accounts', name: 'Accounts', component: () => import('@/views/AccountsView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/students' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
```

- [ ] **Step 2: Commit**

```bash
git add src/router/index.js
git commit -m "feat: update routes for Phase 1 views"
```

---

## Task 12: StudentsView

**Files:**
- Create: `src/views/StudentsView.vue`

- [ ] **Step 1: Create src/views/StudentsView.vue**

```vue
<template>
  <AppLayout>
    <div class="space-y-4">
      <!-- Header + filters -->
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-100">學生列表</h2>
          <p class="text-xs text-slate-500 mt-0.5">共 {{ filtered.length }} 位學生</p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <select v-model="filterYear" class="input w-36 text-xs">
            <option value="">所有學年</option>
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
          <select v-model="filterClass" class="input w-28 text-xs">
            <option value="">所有班級</option>
            <option v-for="c in classes" :key="c" :value="c">{{ c }}</option>
          </select>
          <input v-model="search" class="input w-40 text-xs" placeholder="搜尋姓名 / 學號…" />
        </div>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="border-b border-dark-border">
            <tr class="text-left text-xs text-slate-500 uppercase tracking-wider">
              <th class="px-4 py-3">學號</th>
              <th class="px-4 py-3">姓名</th>
              <th class="px-4 py-3">班級</th>
              <th class="px-4 py-3">學年度</th>
              <th class="px-4 py-3">組別</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-dark-border">
            <tr
              v-for="s in filtered"
              :key="s.id"
              class="hover:bg-dark-border/20 transition-colors"
            >
              <td class="px-4 py-3 id-mono">{{ s.student_id }}</td>
              <td class="px-4 py-3 text-slate-200 font-medium">{{ s.name }}</td>
              <td class="px-4 py-3 text-slate-400">{{ s.class }}</td>
              <td class="px-4 py-3 text-slate-400">{{ s.school_year }}</td>
              <td class="px-4 py-3">
                <span v-if="s.group_id" class="px-2 py-0.5 rounded-full text-xs bg-accent-glow text-accent border border-accent/20">
                  {{ groupName(s.group_id) }}
                </span>
                <span v-else class="text-slate-600 text-xs">未分組</span>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="5" class="px-4 py-8 text-center text-slate-600 text-sm">無符合條件的學生</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { students } from '@/data/students'
import { groups } from '@/data/groups'

const search = ref('')
const filterYear = ref('')
const filterClass = ref('')

const years = [...new Set(students.map(s => s.school_year))].sort().reverse()
const classes = [...new Set(students.map(s => s.class))].sort()

const filtered = computed(() => students.filter(s => {
  if (filterYear.value && s.school_year !== filterYear.value) return false
  if (filterClass.value && s.class !== filterClass.value) return false
  if (search.value) {
    const q = search.value.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q)
  }
  return true
}))

function groupName(id) {
  const g = groups.find(g => g.id === id)
  return g ? `第${g.number}組` : '—'
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/StudentsView.vue
git commit -m "feat: StudentsView with search and year/class filters"
```

---

## Task 13: GroupsView

**Files:**
- Create: `src/views/GroupsView.vue`

- [ ] **Step 1: Create src/views/GroupsView.vue**

```vue
<template>
  <AppLayout>
    <div class="space-y-4">
      <!-- Header + filter -->
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-100">組別列表</h2>
          <p class="text-xs text-slate-500 mt-0.5">共 {{ filteredGroups.length }} 個組別</p>
        </div>
        <select v-model="filterYear" class="input w-36 text-xs">
          <option value="">所有學年</option>
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>

      <!-- Grid of group cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="g in filteredGroups"
          :key="g.id"
          class="card p-4 space-y-3 hover:border-accent/30 transition-colors"
        >
          <!-- Group header -->
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="id-mono">第 {{ g.number }} 組</span>
                <span class="text-xs text-slate-500 px-1.5 py-0.5 rounded bg-dark-border">{{ g.school_year }}</span>
              </div>
              <p class="text-slate-100 font-semibold mt-1">{{ g.name }}</p>
            </div>
            <span class="text-2xl">📋</span>
          </div>

          <!-- Teachers -->
          <div class="space-y-1">
            <p class="text-xs text-slate-500 uppercase tracking-wider">指導老師</p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="tid in g.teacher_ids"
                :key="tid"
                class="px-2 py-0.5 rounded-full text-xs bg-dark-border text-slate-300"
              >{{ teacherName(tid) }}</span>
            </div>
          </div>

          <!-- Members -->
          <div class="space-y-1">
            <p class="text-xs text-slate-500 uppercase tracking-wider">組員（{{ members(g.id).length }} 人）</p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="s in members(g.id)"
                :key="s.id"
                class="px-2 py-0.5 rounded text-xs bg-accent-glow text-accent border border-accent/10"
              >{{ s.name }}</span>
              <span v-if="members(g.id).length === 0" class="text-slate-600 text-xs">尚無組員</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { groups } from '@/data/groups'
import { students } from '@/data/students'
import { teachers } from '@/data/teachers'

const filterYear = ref('')
const years = [...new Set(groups.map(g => g.school_year))].sort().reverse()

const filteredGroups = computed(() =>
  filterYear.value ? groups.filter(g => g.school_year === filterYear.value) : groups
)

function members(groupId) {
  return students.filter(s => s.group_id === groupId)
}
function teacherName(tid) {
  return teachers.find(t => t.id === tid)?.name ?? tid
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/GroupsView.vue
git commit -m "feat: GroupsView with cards showing members and teachers"
```

---

## Task 14: RemoveStudentView

**Files:**
- Create: `src/views/changes/RemoveStudentView.vue`

- [ ] **Step 1: Create directory and file**

Create `src/views/changes/RemoveStudentView.vue`:

```vue
<template>
  <AppLayout>
    <div class="max-w-lg space-y-6">
      <div>
        <h2 class="text-lg font-bold text-slate-100">移除學生出組</h2>
        <p class="text-xs text-slate-500 mt-0.5">從組別中移除學生，學生將變為未分組狀態</p>
      </div>

      <!-- Step 1: Select group -->
      <div class="card p-4 space-y-3">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">① 選擇組別</p>
        <select v-model="selectedGroupId" class="input text-sm" @change="selectedStudentId = ''">
          <option value="">-- 請選擇組別 --</option>
          <option v-for="g in groups" :key="g.id" :value="g.id">
            {{ g.school_year }} 第{{ g.number }}組 — {{ g.name }}
          </option>
        </select>
      </div>

      <!-- Step 2: Select student -->
      <div v-if="selectedGroupId" class="card p-4 space-y-3">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">② 選擇學生</p>
        <div v-if="groupMembers.length === 0" class="text-slate-600 text-sm">此組別目前沒有學生</div>
        <div v-else class="flex flex-col gap-1">
          <label
            v-for="s in groupMembers"
            :key="s.id"
            class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors"
            :class="selectedStudentId === s.id ? 'bg-red-500/10 border border-red-500/30' : 'hover:bg-dark-border/30'"
          >
            <input type="radio" :value="s.id" v-model="selectedStudentId" class="accent-red-500" />
            <span class="text-slate-200 text-sm font-medium">{{ s.name }}</span>
            <span class="id-mono">{{ s.student_id }}</span>
            <span class="text-slate-500 text-xs ml-auto">{{ s.class }}</span>
          </label>
        </div>
      </div>

      <!-- Step 3: Confirm -->
      <div v-if="selectedStudent" class="card p-4 space-y-4 border-red-500/20">
        <p class="text-xs font-semibold uppercase tracking-wider text-red-400">③ 確認移除</p>
        <div class="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-sm text-slate-300">
          確定將 <span class="text-red-400 font-semibold">{{ selectedStudent.name }}</span> 從
          <span class="text-accent font-semibold">第{{ selectedGroup.number }}組</span> 移除？
          <br><span class="text-slate-500 text-xs mt-1 block">移除後學生將變為未分組狀態，此操作將被記錄在改動記錄中。</span>
        </div>
        <button @click="confirmRemove" class="btn-danger w-full">
          確認移除
        </button>
      </div>

      <!-- Success message -->
      <div v-if="successMsg" class="bg-accent-glow border border-accent/20 rounded-lg px-4 py-3 text-accent text-sm">
        ✓ {{ successMsg }}
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { groups } from '@/data/groups'
import { students } from '@/data/students'

const selectedGroupId = ref('')
const selectedStudentId = ref('')
const successMsg = ref('')

const selectedGroup = computed(() => groups.find(g => g.id === selectedGroupId.value))
const groupMembers = computed(() => students.filter(s => s.group_id === selectedGroupId.value))
const selectedStudent = computed(() => students.find(s => s.id === selectedStudentId.value))

function confirmRemove() {
  const student = selectedStudent.value
  if (!student) return
  // Mutate mock data in-place (Phase 1 only — no DB call)
  student.group_id = null
  successMsg.value = `已將 ${student.name} 從第${selectedGroup.value.number}組移除`
  selectedStudentId.value = ''
  setTimeout(() => { successMsg.value = '' }, 3000)
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/changes/RemoveStudentView.vue
git commit -m "feat: RemoveStudentView with 3-step select group → select student → confirm"
```

---

## Task 15: Placeholder Views

**Files:**
- Create: `src/views/DataView.vue`
- Create: `src/views/AccountsView.vue`

- [ ] **Step 1: Create src/views/DataView.vue**

```vue
<template>
  <AppLayout>
    <div class="flex flex-col items-center justify-center h-64 text-center space-y-3">
      <span class="text-4xl">🗄️</span>
      <p class="text-slate-300 font-semibold">資料管理</p>
      <p class="text-slate-600 text-sm">此功能尚未開放，敬請期待</p>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
</script>
```

- [ ] **Step 2: Create src/views/AccountsView.vue**

```vue
<template>
  <AppLayout>
    <div class="flex flex-col items-center justify-center h-64 text-center space-y-3">
      <span class="text-4xl">👤</span>
      <p class="text-slate-300 font-semibold">帳號管理</p>
      <p class="text-slate-600 text-sm">此功能尚未開放，敬請期待</p>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
</script>
```

- [ ] **Step 3: Commit**

```bash
git add src/views/DataView.vue src/views/AccountsView.vue
git commit -m "feat: placeholder views for 資料 and 帳號"
```

---

## Task 16: Remove Old Views + Dev Server Check

**Files:**
- Delete: `src/views/PublicView.vue` (doesn't exist yet, skip)
- Delete: `src/views/AdminView.vue` (doesn't exist yet, skip)
- Delete: `src/views/NotFoundView.vue` (doesn't exist yet, skip)

- [ ] **Step 1: Run dev server**

```bash
npm run dev
```

Expected: server starts at `http://localhost:5173`, no console errors.

- [ ] **Step 2: Verify in browser**

Open `http://localhost:5173`:
- Redirects to `/#/students`
- Dark sidebar visible with logo and nav groups
- Student table shows 30 students
- Filters work
- Navigate to `/groups` — cards show groups with members and teachers
- Navigate to `/changes/remove-student` — 3-step form works, selecting a group shows its members
- Confirm remove — student disappears from the list
- Dark/light mode toggle switches theme

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: Phase 1 UI shell complete — sidebar, views, mock data"
```
