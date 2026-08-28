import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, getToken, setToken } from '@/lib/api'
import { usePermissionsStore, GUEST_GROUP } from '@/stores/permissions'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  // role 存的是權限分組 key（permission_groups.key）；未登入就是 guest 分組。
  const role = ref(GUEST_GROUP)

  const isLoggedIn = computed(() => user.value !== null)
  // 管理員＝所屬分組被標記 is_admin（帳號管理／權限設定）。頁面權限一律問
  // perms.canAccess / perms.canEdit，不要再用角色字串判斷。
  const isAdmin = computed(() => usePermissionsStore().isAdminGroup(role.value))

  function applyAccount(account) {
    user.value = account
    role.value = account?.role ?? GUEST_GROUP
  }

  async function init() {
    if (!getToken()) return
    try {
      applyAccount(await api.get('/auth/me'))
    } catch {
      // token expired or invalid — drop it and stay logged out
      setToken(null)
      user.value = null
      role.value = GUEST_GROUP
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
    role.value = GUEST_GROUP
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

  return { user, role, isLoggedIn, isAdmin, init, signIn, signOut, changePassword }
})
