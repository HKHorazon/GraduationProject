<script setup>
import { ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const oldPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const error = ref('')
const message = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  message.value = ''
  if (!oldPwd.value || !newPwd.value || !confirmPwd.value) {
    error.value = '請填寫所有欄位'
    return
  }
  if (newPwd.value.length < 6) {
    error.value = '新密碼至少 6 個字元'
    return
  }
  if (newPwd.value !== confirmPwd.value) {
    error.value = '兩次輸入的新密碼不一致'
    return
  }
  busy.value = true
  try {
    await auth.changePassword(oldPwd.value, newPwd.value)
    message.value = '密碼已更新'
    oldPwd.value = ''
    newPwd.value = ''
    confirmPwd.value = ''
  } catch (e) {
    error.value = e.message ?? '密碼變更失敗'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="space-y-4">
      <div>
        <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">修改密碼</h2>
        <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
          {{ auth.isLoggedIn ? `帳號：${auth.user?.username ?? ''}` : '請先登入後再修改密碼' }}
        </p>
      </div>

      <div class="card p-4">
        <p v-if="!auth.isLoggedIn" class="text-sm text-slate-600 dark:text-slate-400">
          尚未登入，請先由右上角登入。
        </p>

        <form v-else @submit.prevent="submit" class="space-y-3">
          <div class="space-y-1">
            <label class="label">舊密碼 <span class="text-red-700 dark:text-red-400">*</span></label>
            <input
              v-model="oldPwd"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="input w-full text-sm"
              :disabled="busy"
            />
          </div>
          <div class="space-y-1">
            <label class="label">新密碼（至少 6 個字元） <span class="text-red-700 dark:text-red-400">*</span></label>
            <input
              v-model="newPwd"
              type="password"
              autocomplete="new-password"
              placeholder="••••••••"
              class="input w-full text-sm"
              :disabled="busy"
            />
          </div>
          <div class="space-y-1">
            <label class="label">確認新密碼 <span class="text-red-700 dark:text-red-400">*</span></label>
            <input
              v-model="confirmPwd"
              type="password"
              autocomplete="new-password"
              placeholder="••••••••"
              class="input w-full text-sm"
              :disabled="busy"
            />
          </div>

          <p v-if="error" class="text-xs text-red-700 dark:text-red-400">{{ error }}</p>
          <p v-if="message" class="text-xs text-emerald-800 dark:text-emerald-400">{{ message }}</p>

          <div class="flex">
            <button type="submit" :disabled="busy" class="btn-primary flex items-center gap-2 disabled:opacity-50">
              <Loader2 v-if="busy" class="w-4 h-4 animate-spin" />
              {{ busy ? '處理中…' : '更新密碼' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>
