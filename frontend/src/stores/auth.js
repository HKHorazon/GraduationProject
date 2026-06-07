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
  }

  function signOut() {
    setToken(null)
    user.value = null
    role.value = 'viewer'
  }

  return { user, role, isLoggedIn, isEditor, isSuperAdmin, init, signIn, signOut }
})
