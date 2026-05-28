<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { Sun, Moon, LogIn, LogOut, X, Loader2 } from 'lucide-vue-next'

const theme = useThemeStore()
const auth = useAuthStore()
const route = useRoute()

const pageTitles = {
  '/students': '學生列表',
  '/groups': '組別列表',
  '/changes/remove-student': '移除學生出組',
  '/data': '資料管理',
  '/accounts': '帳號管理',
}

const pageTitle = computed(() => pageTitles[route.path] ?? '畢業專題管理系統')

// Login panel state
const loginOpen = ref(false)
const loginEmail = ref('')
const loginPassword = ref('')
const loginError = ref('')
const loginLoading = ref(false)

function openLogin() {
  loginOpen.value = true
  loginError.value = ''
}

function closeLogin() {
  loginOpen.value = false
  loginEmail.value = ''
  loginPassword.value = ''
  loginError.value = ''
  loginLoading.value = false
}

async function handleLogin() {
  if (!loginEmail.value || !loginPassword.value) {
    loginError.value = '請填寫帳號與密碼'
    return
  }
  loginLoading.value = true
  loginError.value = ''
  try {
    await auth.signIn(loginEmail.value, loginPassword.value)
    closeLogin()
  } catch (e) {
    loginError.value = e.message ?? '登入失敗，請確認帳號密碼'
  } finally {
    loginLoading.value = false
  }
}

async function handleLogout() {
  await auth.signOut()
}

function handleClickOutside(e) {
  if (loginOpen.value && !e.target.closest('[data-login-panel]')) {
    closeLogin()
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <header class="flex items-center justify-between h-14 px-6 flex-shrink-0
                 bg-white dark:bg-[#161b27]
                 border-b border-slate-200 dark:border-[#2a3347]">
    <h1 class="text-slate-700 dark:text-slate-200 text-sm font-semibold tracking-wide">{{ pageTitle }}</h1>

    <div class="flex items-center gap-3">
      <!-- Dark mode toggle -->
      <button
        @click="theme.toggle()"
        class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer
               bg-slate-100 dark:bg-[#1e2535]
               border border-slate-200 dark:border-[#2a3347]
               text-slate-500 dark:text-slate-400
               hover:border-blue-400 dark:hover:border-cyan-400 hover:text-blue-600 dark:hover:text-cyan-400"
        :title="theme.isDark ? '切換淺色模式' : '切換深色模式'"
      >
        <Sun v-if="theme.isDark" class="w-4 h-4" />
        <Moon v-else class="w-4 h-4" />
      </button>

      <!-- User / Login area -->
      <div class="relative" data-login-panel>
        <!-- Logged in: show email + logout -->
        <div v-if="auth.isLoggedIn" class="flex items-center gap-2">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg
                      bg-slate-100 dark:bg-[#1e2535]
                      border border-slate-200 dark:border-[#2a3347]">
            <span class="w-2 h-2 rounded-full"
              :class="auth.isEditor ? 'bg-blue-600 dark:bg-cyan-400' : 'bg-slate-400 dark:bg-slate-500'">
            </span>
            <span class="text-xs text-slate-600 dark:text-slate-300 font-mono max-w-[140px] truncate">
              {{ auth.user?.email ?? auth.role.toUpperCase() }}
            </span>
          </div>
          <button
            @click="handleLogout"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer
                   bg-slate-100 dark:bg-[#1e2535]
                   border border-slate-200 dark:border-[#2a3347]
                   text-slate-500 dark:text-slate-400
                   hover:border-red-400 dark:hover:border-red-400 hover:text-red-500 dark:hover:text-red-400"
          >
            <LogOut class="w-3.5 h-3.5" />
            登出
          </button>
        </div>

        <!-- Not logged in: login button -->
        <button
          v-else
          @click="openLogin"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer
                 bg-blue-600 dark:bg-cyan-500 text-white
                 hover:bg-blue-700 dark:hover:bg-cyan-400"
        >
          <LogIn class="w-3.5 h-3.5" />
          登入
        </button>

        <!-- Login dropdown panel -->
        <Transition
          enter-active-class="transition-all duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-100 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div
            v-if="loginOpen"
            class="absolute right-0 top-full mt-2 w-72 rounded-xl shadow-lg z-50
                   bg-white dark:bg-[#1a2235]
                   border border-slate-200 dark:border-[#2a3347]"
          >
            <!-- Panel header -->
            <div class="flex items-center justify-between px-4 pt-4 pb-3
                        border-b border-slate-100 dark:border-[#2a3347]">
              <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">登入帳號</span>
              <button
                @click="closeLogin"
                class="w-6 h-6 flex items-center justify-center rounded-md transition-colors cursor-pointer
                       text-slate-400 dark:text-slate-500
                       hover:text-slate-600 dark:hover:text-slate-300
                       hover:bg-slate-100 dark:hover:bg-[#2a3347]"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleLogin" class="p-4 space-y-3">
              <div class="space-y-1">
                <label class="text-xs text-slate-500 dark:text-slate-400">帳號</label>
                <input
                  v-model="loginEmail"
                  type="text"
                  autocomplete="email"
                  placeholder="帳號 / 電子郵件"
                  class="input w-full text-sm"
                  :disabled="loginLoading"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs text-slate-500 dark:text-slate-400">密碼</label>
                <input
                  v-model="loginPassword"
                  type="password"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="input w-full text-sm"
                  :disabled="loginLoading"
                />
              </div>

              <!-- Error -->
              <p v-if="loginError" class="text-xs text-red-500 dark:text-red-400">{{ loginError }}</p>

              <!-- Submit -->
              <button
                type="submit"
                :disabled="loginLoading"
                class="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium
                       transition-colors cursor-pointer
                       bg-blue-600 dark:bg-cyan-500 text-white
                       hover:bg-blue-700 dark:hover:bg-cyan-400
                       disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Loader2 v-if="loginLoading" class="w-4 h-4 animate-spin" />
                {{ loginLoading ? '登入中…' : '登入' }}
              </button>
            </form>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>
