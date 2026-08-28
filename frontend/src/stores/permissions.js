import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/lib/api'

// editOnly：整頁只有操作、沒有東西可看，給「唯讀」等於給不可存取，
// 所以這些頁面的權限只在 不可存取 ↔ 可編輯 之間輪替。
export const PAGES = [
  { key: 'students',        label: '學生列表',    route: '/students' },
  { key: 'groups',          label: '組別列表',    route: '/groups' },
  { key: 'remove-student',  label: '學生更動',    route: '/changes/remove-student', editOnly: true },
  { key: 'group-change',    label: '組別異動',    route: '/changes/group-change',   editOnly: true },
  { key: 'group-order',     label: '組別排序',    route: '/groups/order' },
  { key: 'documents',       label: '文件輸入',    route: '/documents',              editOnly: true },
  { key: 'documents-export', label: '文件輸出',   route: '/documents/export' },
  { key: 'reviews',         label: '審查評分',    route: '/reviews' },
  { key: 'data',            label: '資料管理',    route: '/data',                   editOnly: true },
  { key: 'audit-logs',      label: '異動紀錄',    route: '/audit-logs' },
]

const EDIT_ONLY = new Set(PAGES.filter((p) => p.editOnly).map((p) => p.key))

export function levelsFor(pageKey) {
  return EDIT_ONLY.has(pageKey) ? ['none', 'edit'] : LEVELS
}

// 三階存取權：不可存取 → 唯讀 → 可編輯。後端 app/pageperm.py 依同一張表放行，
// 這裡的判斷只是 UX（先藏起來），真正的門在伺服器。
export const LEVELS = ['none', 'view', 'edit']
export const LEVEL_LABELS = { none: '不可存取', view: '唯讀', edit: '可編輯' }
const ORDER = { none: 0, view: 1, edit: 2 }

// 未登入的人算在這個分組；它與管理員分組都是後端內建、不可刪除。
export const GUEST_GROUP = 'guest'

// load() 回來前先用這份，畫面才不會閃一下全空。與 backend/seed.py 對齊。
const DEFAULT_GROUPS = [
  { key: 'guest',       label: '未登入訪客', is_admin: false, builtin: true,  sort: 0 },
  { key: 'viewer',      label: '檢視者',     is_admin: false, builtin: false, sort: 1 },
  { key: 'editor',      label: '編輯者',     is_admin: false, builtin: false, sort: 2 },
  { key: 'super_admin', label: '系統管理員', is_admin: true,  builtin: true,  sort: 99 },
]

// page_key -> group_key -> level
export const DEFAULT_PERMISSIONS = {
  'students':         { guest: 'view', viewer: 'view', editor: 'edit' },
  'groups':           { guest: 'view', viewer: 'view', editor: 'edit' },
  'remove-student':   { guest: 'none', viewer: 'none', editor: 'edit' },
  'group-change':     { guest: 'none', viewer: 'none', editor: 'edit' },
  'group-order':      { guest: 'none', viewer: 'none', editor: 'edit' },
  'documents':        { guest: 'none', viewer: 'none', editor: 'edit' },
  'documents-export': { guest: 'none', viewer: 'none', editor: 'edit' },
  'reviews':          { guest: 'none', viewer: 'none', editor: 'edit' },
  'data':             { guest: 'none', viewer: 'none', editor: 'edit' },
  'audit-logs':       { guest: 'none', viewer: 'none', editor: 'edit' },
}

// perms 是 reactive proxy，structuredClone 會丟 DataCloneError，
// 這張矩陣全是純 JSON，用 round-trip 複製最省事。
function clone(matrix) {
  return JSON.parse(JSON.stringify(matrix))
}

function defaultMatrix() {
  const out = {}
  for (const g of DEFAULT_GROUPS) out[g.key] = {}
  for (const [page, byGroup] of Object.entries(DEFAULT_PERMISSIONS)) {
    for (const [group, level] of Object.entries(byGroup)) out[group][page] = level
  }
  return out
}

export const usePermissionsStore = defineStore('permissions', () => {
  // The matrix lives in the backend (global + persistent). Start from defaults
  // so the UI renders sensibly before load() resolves.
  const groups = ref(structuredClone(DEFAULT_GROUPS))
  const perms = ref(defaultMatrix())          // group_key -> page_key -> level

  // 管理員分組固定全權，不進矩陣，所以設定畫面只列其餘的
  const editableGroups = computed(() => groups.value.filter((g) => !g.is_admin))
  const adminGroups = computed(() => groups.value.filter((g) => g.is_admin))

  function apply(data) {
    groups.value = data?.groups ?? structuredClone(DEFAULT_GROUPS)
    perms.value = data?.perms ?? {}
  }

  async function load() {
    try {
      apply(await api.get('/permissions'))
    } catch {
      // never block the app on a failed load — fall back to defaults silently
      groups.value = structuredClone(DEFAULT_GROUPS)
      perms.value = defaultMatrix()
    }
  }

  function groupOf(groupKey) {
    return groups.value.find((g) => g.key === groupKey) ?? null
  }

  function groupLabel(groupKey) {
    return groupOf(groupKey)?.label ?? groupKey
  }

  function isAdminGroup(groupKey) {
    return groupOf(groupKey)?.is_admin === true
  }

  function levelOf(pageKey, groupKey) {
    if (isAdminGroup(groupKey)) return 'edit'
    return perms.value[groupKey]?.[pageKey] ?? 'none'
  }

  function canAccess(pageKey, groupKey) {
    return ORDER[levelOf(pageKey, groupKey)] >= ORDER.view
  }

  function canEdit(pageKey, groupKey) {
    return levelOf(pageKey, groupKey) === 'edit'
  }

  async function saveMatrix(previous) {
    try {
      apply(await api.put('/permissions', perms.value))
    } catch (e) {
      perms.value = previous // revert on failure
      throw new Error(e?.message || '權限設定儲存失敗')
    }
  }

  // 點一下往下一階輪替：不可存取 → 唯讀 → 可編輯 → 不可存取
  async function cycle(pageKey, groupKey) {
    if (isAdminGroup(groupKey)) return
    const previous = clone(perms.value)
    const cycleLevels = levelsFor(pageKey)
    const current = levelOf(pageKey, groupKey)
    const at = cycleLevels.indexOf(current)
    if (!perms.value[groupKey]) perms.value[groupKey] = {}
    // 目前是這條輪替上沒有的值（例如 editOnly 頁殘留的 view）就回到第一階
    perms.value[groupKey][pageKey] = cycleLevels[at === -1 ? 0 : (at + 1) % cycleLevels.length]
    await saveMatrix(previous)
  }

  async function reset() {
    const previous = clone(perms.value)
    // 自訂分組沒有「預設值」可還原 —— 一律歸零，比留著半套安全。
    const next = {}
    for (const g of editableGroups.value) {
      next[g.key] = {}
      for (const page of PAGES) {
        next[g.key][page.key] = DEFAULT_PERMISSIONS[page.key]?.[g.key] ?? 'none'
      }
    }
    perms.value = next
    await saveMatrix(previous)
  }

  async function createGroup(label) {
    apply(await api.post('/permissions/groups', { label }))
  }

  async function renameGroup(key, label) {
    apply(await api.patch(`/permissions/groups/${key}`, { label }))
  }

  async function deleteGroup(key) {
    apply(await api.delete(`/permissions/groups/${key}`))
  }

  return {
    groups, perms, editableGroups, adminGroups,
    load, groupOf, groupLabel, isAdminGroup,
    levelOf, canAccess, canEdit,
    cycle, reset, createGroup, renameGroup, deleteGroup,
  }
})
