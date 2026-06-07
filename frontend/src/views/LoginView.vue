<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { GraduationCap, Sun, Moon, LogIn, Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()
const theme = useThemeStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  if (!username.value || !password.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    await auth.signIn(username.value, password.value)
    router.push('/students')
  } catch (err) {
    errorMsg.value = '帳號或密碼錯誤，請重試。'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0f1117] text-slate-800 dark:text-slate-200">
    <!-- Topbar -->
    <header class="flex items-center justify-between h-14 px-6 flex-shrink-0
                   bg-white dark:bg-[#161b27]
                   border-b border-slate-200 dark:border-[#2a3347]">
      <div class="flex items-center gap-2">
        <GraduationCap class="w-5 h-5 text-blue-600 dark:text-cyan-400" />
        <span class="font-bold text-blue-600 dark:text-cyan-400 text-sm tracking-wide">畢業專題</span>
      </div>
      <button
        @click="theme.toggle()"
        class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer
               bg-slate-100 dark:bg-[#1e2535]
               border border-slate-200 dark:border-[#2a3347]
               text-slate-500 dark:text-slate-400
               hover:border-blue-400 dark:hover:border-cyan-400 hover:text-blue-600 dark:hover:text-cyan-400"
      >
        <Sun v-if="theme.isDark" class="w-4 h-4" />
        <Moon v-else class="w-4 h-4" />
      </button>
    </header>

    <!-- Login card -->
    <main class="flex-1 flex items-center justify-center p-6">
      <div class="w-full max-w-sm">
        <div class="bg-white dark:bg-[#161b27] rounded-2xl border border-slate-200 dark:border-[#2a3347] shadow-sm p-8">
          <!-- Title -->
          <div class="mb-8 text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-cyan-400/10 mb-4">
              <GraduationCap class="w-6 h-6 text-blue-600 dark:text-cyan-400" />
            </div>
            <h1 class="text-lg font-bold text-slate-800 dark:text-slate-100">編輯者登入</h1>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">請使用指定帳號登入以編輯資料</p>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
            <!-- Username -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-slate-500 dark:text-slate-400">帳號</label>
              <input
                v-model="username"
                type="text"
                autocomplete="username"
                placeholder="請輸入帳號"
                class="w-full px-3 py-2.5 text-sm rounded-lg border outline-none transition-colors
                       bg-slate-50 dark:bg-[#0f1117]
                       border-slate-200 dark:border-[#2a3347]
                       text-slate-800 dark:text-slate-200
                       placeholder-slate-300 dark:placeholder-slate-600
                       focus:border-blue-400 dark:focus:border-cyan-400"
              />
            </div>

            <!-- Password -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-slate-500 dark:text-slate-400">密碼</label>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="w-full px-3 py-2.5 pr-10 text-sm rounded-lg border outline-none transition-colors
                         bg-slate-50 dark:bg-[#0f1117]
                         border-slate-200 dark:border-[#2a3347]
                         text-slate-800 dark:text-slate-200
                         placeholder-slate-300 dark:placeholder-slate-600
                         focus:border-blue-400 dark:focus:border-cyan-400"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500
                         hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <Eye v-if="!showPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Error -->
            <p v-if="errorMsg" class="text-xs text-red-500 dark:text-red-400">{{ errorMsg }}</p>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="loading || !username || !password"
              class="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium
                     transition-colors cursor-pointer
                     bg-blue-600 dark:bg-cyan-500 text-white
                     hover:bg-blue-700 dark:hover:bg-cyan-400
                     disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <LogIn class="w-4 h-4" />
              {{ loading ? '登入中...' : '登入' }}
            </button>
          </form>

          <!-- Back -->
          <div class="mt-6 text-center">
            <router-link
              to="/students"
              class="text-xs text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
            >
              ← 返回瀏覽（不需登入）
            </router-link>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
