import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const PAGES = [
  { key: 'students',        label: '學生列表',    route: '/students' },
  { key: 'groups',          label: '組別列表',    route: '/groups' },
  { key: 'remove-student',  label: '學生更動',    route: '/changes/remove-student' },
  { key: 'group-change',    label: '組別異動',    route: '/changes/group-change' },
  { key: 'documents',       label: '文件輸入',    route: '/documents' },
  { key: 'documents-export', label: '文件輸出',   route: '/documents/export' },
  { key: 'data',            label: '資料管理',    route: '/data' },
  { key: 'audit-logs',      label: '異動紀錄',    route: '/audit-logs' },
]

// super_admin always has full access — not editable
const STORAGE_KEY = 'page-permissions'

const DEFAULT_PERMISSIONS = {
  students:       { viewer: true,  editor: true  },
  groups:         { viewer: true,  editor: true  },
  'remove-student': { viewer: false, editor: true  },
  'group-change': { viewer: false, editor: true  },
  documents:      { viewer: false, editor: true  },
  'documents-export': { viewer: false, editor: true },
  data:           { viewer: false, editor: true  },
  'audit-logs':   { viewer: false, editor: true  },
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    // merge over defaults so newly added pages get their default access
    // even when an older permission set is already saved
    if (raw) return { ...structuredClone(DEFAULT_PERMISSIONS), ...JSON.parse(raw) }
  } catch {}
  return null
}

export const usePermissionsStore = defineStore('permissions', () => {
  const perms = ref(loadFromStorage() ?? structuredClone(DEFAULT_PERMISSIONS))

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(perms.value))
  }

  function canAccess(pageKey, role) {
    if (role === 'super_admin') return true
    return perms.value[pageKey]?.[role] ?? false
  }

  function toggle(pageKey, role) {
    if (role === 'super_admin') return
    perms.value[pageKey][role] = !perms.value[pageKey][role]
    save()
  }

  function reset() {
    perms.value = structuredClone(DEFAULT_PERMISSIONS)
    save()
  }

  return { perms, canAccess, toggle, reset }
})
