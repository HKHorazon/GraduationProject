import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, getToken, setToken } from '@/lib/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const role = ref('viewer')

  const isLoggedIn = computed(() => user.value !== null)
  const isEditor = computed(() => role.value === 'editor' || role.value === 'super_admin')
  const isSuperAdmin = computed(() => role.value === 'super_admin')

  function applyAccount(account) {
    user.value = account
    role.value = account?.role ?? 'viewer'
  }

  async function init() {
    if (!getToken()) return
    try {
      applyAccount(await api.get('/auth/me'))
    } catch {
      // token expired or invalid — drop it and stay logged out
      setToken(null)
      user.value = null
      role.value = 'viewer'
    }
  }

  async function signIn(username, password) {
    // OAuth2 password flow expects form-encoded username/password
    const body = new URLSearchParams({ username, password })
    const { access_token } = await api.post('/auth/login', body, { auth: false })
    setToken(access_token)
    applyAccount(await api.get('/auth/me'))
    // 伺服器端會依登入狀態遮蔽姓名，快取可能仍是遮蔽版——重新載入取得真實姓名。
    const { useDataStore } = await import('@/stores/data')
    await useDataStore().loadAll()
  }

  async function signOut() {
    setToken(null)
    user.value = null
    role.value = 'viewer'
    // 登出後快取可能仍是真實姓名——重新載入取得遮蔽版。
    const { useDataStore } = await import('@/stores/data')
    await useDataStore().loadAll()
  }

  async function changePassword(oldPassword, newPassword) {
    await api.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    })
  }

  return { user, role, isLoggedIn, isEditor, isSuperAdmin, init, signIn, signOut, changePassword }
})
