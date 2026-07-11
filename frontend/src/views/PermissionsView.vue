<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore, PAGES } from '@/stores/permissions'
import { ShieldOff, Shield, Edit3, Eye, RotateCcw, Check } from 'lucide-vue-next'
import { ref } from 'vue'

const auth = useAuthStore()
const perms = usePermissionsStore()

const saved = ref(false)
const error = ref('')

async function handleToggle(pageKey, role) {
  error.value = ''
  try {
    await perms.toggle(pageKey, role)
    saved.value = true
    setTimeout(() => { saved.value = false }, 1500)
  } catch (e) {
    error.value = e?.message || '權限設定儲存失敗'
  }
}

async function handleReset() {
  error.value = ''
  try {
    await perms.reset()
    saved.value = true
    setTimeout(() => { saved.value = false }, 1500)
  } catch (e) {
    error.value = e?.message || '權限設定還原失敗'
  }
}

const ROLES = [
  { key: 'viewer',      label: 'VIEWER',      icon: Eye,    color: 'text-slate-500 dark:text-slate-400' },
  { key: 'editor',      label: 'EDITOR',      icon: Edit3,  color: 'text-blue-600 dark:text-cyan-400' },
  { key: 'super_admin', label: 'SUPER ADMIN', icon: Shield, color: 'text-amber-600 dark:text-amber-400' },
]
</script>

<template>
  <AppLayout>
    <!-- No permission -->
    <div v-if="!auth.isSuperAdmin"
         class="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#2a3347] flex items-center justify-center">
        <ShieldOff class="w-6 h-6 text-slate-400" />
      </div>
      <p class="font-semibold text-slate-700 dark:text-slate-300">無存取權限</p>
      <p class="text-sm text-slate-400">此頁面僅限 Super Admin 使用</p>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="font-bold text-slate-800 dark:text-slate-100">權限設定</h2>
          <p class="text-xs text-slate-400 mt-0.5">設定各角色可存取的頁面</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Saved indicator -->
          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <span v-if="saved"
                  class="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <Check class="w-3.5 h-3.5" />已儲存
            </span>
          </Transition>

          <!-- Save error -->
          <span v-if="error"
                class="text-xs text-red-600 dark:text-red-400">{{ error }}</span>

          <button
            @click="handleReset"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer
                   border border-slate-200 dark:border-[#2a3347]
                   text-slate-500 dark:text-slate-400
                   hover:border-slate-300 dark:hover:border-slate-500
                   hover:text-slate-700 dark:hover:text-slate-200"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            還原預設
          </button>
        </div>
      </div>

      <!-- Permission matrix -->
      <div class="bg-white dark:bg-[#161b27] rounded-xl border border-slate-200 dark:border-[#2a3347] overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-100 dark:border-[#2a3347]">
              <th class="text-left px-5 py-3 text-xs font-medium text-slate-400 dark:text-slate-500 w-48">頁面</th>
              <th
                v-for="role in ROLES"
                :key="role.key"
                class="px-4 py-3 text-center"
              >
                <div class="flex items-center justify-center gap-1.5">
                  <component :is="role.icon" class="w-3.5 h-3.5" :class="role.color" />
                  <span class="text-xs font-medium" :class="role.color">{{ role.label }}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="page in PAGES"
              :key="page.key"
              class="border-b border-slate-50 dark:border-[#1e2535] last:border-0
                     hover:bg-slate-50 dark:hover:bg-[#1a2235] transition-colors"
            >
              <td class="px-5 py-4">
                <div class="font-medium text-slate-700 dark:text-slate-200 text-sm">{{ page.label }}</div>
                <div class="text-xs text-slate-400 font-mono mt-0.5">{{ page.route }}</div>
              </td>

              <!-- viewer -->
              <td class="px-4 py-4 text-center">
                <button
                  @click="handleToggle(page.key, 'viewer')"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
                  :class="perms.canAccess(page.key, 'viewer')
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                    : 'bg-slate-100 dark:bg-[#1e2535] text-slate-300 dark:text-slate-600 hover:bg-slate-200 dark:hover:bg-[#2a3347]'"
                >
                  <Check class="w-4 h-4" />
                </button>
              </td>

              <!-- editor -->
              <td class="px-4 py-4 text-center">
                <button
                  @click="handleToggle(page.key, 'editor')"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
                  :class="perms.canAccess(page.key, 'editor')
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                    : 'bg-slate-100 dark:bg-[#1e2535] text-slate-300 dark:text-slate-600 hover:bg-slate-200 dark:hover:bg-[#2a3347]'"
                >
                  <Check class="w-4 h-4" />
                </button>
              </td>

              <!-- super_admin: always on, not clickable -->
              <td class="px-4 py-4 text-center">
                <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg
                             bg-amber-100 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400
                             opacity-60 cursor-not-allowed">
                  <Check class="w-4 h-4" />
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Note -->
      <p class="mt-3 text-xs text-slate-400 dark:text-slate-500">
        Super Admin 固定擁有全部頁面的存取權，無法調整。帳號管理與權限設定頁面同樣僅限 Super Admin。
      </p>
    </template>
  </AppLayout>
</template>
