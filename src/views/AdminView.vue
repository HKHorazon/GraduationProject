<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.signIn(email.value, password.value)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- 未登入：顯示登入表單 -->
  <div v-if="!auth.isLoggedIn" class="min-h-screen bg-slate-50 flex items-center justify-center">
    <div class="card p-8 w-full max-w-sm">
      <h1 class="text-xl font-semibold text-slate-800 mb-1">管理後台</h1>
      <p class="text-sm text-slate-400 mb-6">請登入以繼續</p>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="label">Email</label>
          <input v-model="email" type="email" class="input" required />
        </div>
        <div>
          <label class="label">密碼</label>
          <input v-model="password" type="password" class="input" required />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? '登入中...' : '登入' }}
        </button>
      </form>
    </div>
  </div>

  <!-- 已登入：管理內容 -->
  <div v-else class="min-h-screen bg-slate-50 p-8">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-semibold text-slate-800">管理後台</h1>
        <button class="btn-secondary" @click="auth.signOut()">登出</button>
      </div>
      <p class="text-slate-500">功能開發中...</p>
    </div>
  </div>
</template>
