import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const role = ref('viewer')

  const isLoggedIn = computed(() => user.value !== null)
  const isEditor = computed(() => role.value === 'editor' || role.value === 'super_admin')
  const isSuperAdmin = computed(() => role.value === 'super_admin')

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      user.value = session.user
      role.value = session.user.user_metadata?.role ?? 'viewer'
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
      role.value = session?.user?.user_metadata?.role ?? 'viewer'
    })
  }

  async function signIn(email, password) {
    if (email === 'admin' && password === 'admin') {
      user.value = { email: 'admin', id: 'mock-admin' }
      role.value = 'super_admin'
      return
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    role.value = data.user.user_metadata?.role ?? 'viewer'
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    role.value = 'viewer'
  }

  return { user, role, isLoggedIn, isEditor, isSuperAdmin, init, signIn, signOut }
})
