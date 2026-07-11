import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'

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
export const DEFAULT_PERMISSIONS = {
  students:       { viewer: true,  editor: true  },
  groups:         { viewer: true,  editor: true  },
  'remove-student': { viewer: false, editor: true  },
  'group-change': { viewer: false, editor: true  },
  documents:      { viewer: false, editor: true  },
  'documents-export': { viewer: false, editor: true },
  data:           { viewer: false, editor: true  },
  'audit-logs':   { viewer: false, editor: true  },
}

export const usePermissionsStore = defineStore('permissions', () => {
  // The map lives in the backend (global + persistent). Start from defaults so
  // the UI renders sensibly before load() resolves.
  const perms = ref(structuredClone(DEFAULT_PERMISSIONS))

  async function load() {
    try {
      const data = await api.get('/permissions')
      // merge the server map OVER a fresh copy of the defaults, so any newly
      // added page (not yet in the DB) falls back to its default access.
      perms.value = { ...structuredClone(DEFAULT_PERMISSIONS), ...data }
    } catch {
      // never block the app on a failed load — fall back to defaults silently
      perms.value = structuredClone(DEFAULT_PERMISSIONS)
    }
  }

  function canAccess(pageKey, role) {
    if (role === 'super_admin') return true
    return perms.value[pageKey]?.[role] ?? false
  }

  async function toggle(pageKey, role) {
    if (role === 'super_admin') return
    perms.value[pageKey][role] = !perms.value[pageKey][role]
    try {
      await api.put('/permissions', perms.value)
    } catch (e) {
      perms.value[pageKey][role] = !perms.value[pageKey][role] // revert on failure
      throw new Error(e?.message || '權限設定儲存失敗')
    }
  }

  async function reset() {
    const previous = structuredClone(perms.value)
    perms.value = structuredClone(DEFAULT_PERMISSIONS)
    try {
      await api.put('/permissions', perms.value)
    } catch (e) {
      perms.value = previous // revert on failure
      throw new Error(e?.message || '權限設定還原失敗')
    }
  }

  return { perms, load, canAccess, toggle, reset }
})
