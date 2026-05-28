import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const role = ref(null) // 'editor' | 'viewer'

  const isLoggedIn = computed(() => !!user.value)
  const isEditor = computed(() => role.value === 'editor')

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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    role.value = data.user.user_metadata?.role ?? 'viewer'
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    role.value = null
  }

  return { user, role, isLoggedIn, isEditor, init, signIn, signOut }
})
