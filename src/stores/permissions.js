import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const PAGES = [
  { key: 'students',        label: '學生列表',    route: '/students' },
  { key: 'groups',          label: '組別列表',    route: '/groups' },
  { key: 'remove-student',  label: '移除學生出組', route: '/changes/remove-student' },
  { key: 'data',            label: '資料管理',    route: '/data' },
]

// super_admin always has full access — not editable
const STORAGE_KEY = 'page-permissions'

const DEFAULT_PERMISSIONS = {
  students:       { viewer: true,  editor: true  },
  groups:         { viewer: true,  editor: true  },
  'remove-student': { viewer: false, editor: true  },
  data:           { viewer: false, editor: true  },
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
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
