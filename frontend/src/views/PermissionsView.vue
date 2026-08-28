<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import NoAccess from '@/components/common/NoAccess.vue'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore, PAGES } from '@/stores/permissions'
import { Shield, Lock, Eye, EyeOff, Pencil, Plus, Trash2, RotateCcw, Check } from 'lucide-vue-next'
import { ref } from 'vue'

const auth = useAuthStore()
const perms = usePermissionsStore()

const saved = ref(false)
const error = ref('')

// 新增／改名共用一個彈窗
const dialog = ref(null)          // { mode: 'create' | 'rename', key, label }
const dialogError = ref('')
const busy = ref(false)

function flash() {
  saved.value = true
  setTimeout(() => { saved.value = false }, 1500)
}

async function handleCycle(pageKey, groupKey) {
  error.value = ''
  try {
    await perms.cycle(pageKey, groupKey)
    flash()
  } catch (e) {
    error.value = e?.message || '權限設定儲存失敗'
  }
}

async function handleReset() {
  error.value = ''
  if (!confirm('確定還原預設？所有分組的頁面權限都會被覆蓋，自訂分組會全部歸零。')) return
  try {
    await perms.reset()
    flash()
  } catch (e) {
    error.value = e?.message || '權限設定還原失敗'
  }
}

function openCreate() {
  dialogError.value = ''
  dialog.value = { mode: 'create', key: '', label: '' }
}

function openRename(group) {
  dialogError.value = ''
  dialog.value = { mode: 'rename', key: group.key, label: group.label }
}

async function submitDialog() {
  dialogError.value = ''
  const label = dialog.value.label.trim()
  if (!label) {
    dialogError.value = '請輸入分組名稱'
    return
  }
  busy.value = true
  try {
    if (dialog.value.mode === 'create') await perms.createGroup(label)
    else await perms.renameGroup(dialog.value.key, label)
    dialog.value = null
    flash()
  } catch (e) {
    dialogError.value = e?.message || '儲存失敗'
  } finally {
    busy.value = false
  }
}

async function handleDelete(group) {
  error.value = ''
  if (!confirm(`確定刪除分組「${group.label}」？該分組的所有頁面權限設定會一併刪除。`)) return
  try {
    await perms.deleteGroup(group.key)
    flash()
  } catch (e) {
    error.value = e?.message || '刪除失敗'
  }
}

// 三階各有自己的圖示與文字，不只靠顏色區分
const CELL = {
  none: {
    icon: EyeOff, label: '不可存取',
    cls: 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200 ' +
         'dark:border-slate-600 dark:bg-slate-700/30 dark:text-slate-400 dark:hover:bg-slate-700/60',
  },
  view: {
    icon: Eye, label: '唯讀',
    cls: 'border-emerald-600/30 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 ' +
         'dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40',
  },
  edit: {
    icon: Pencil, label: '可編輯',
    cls: 'border-cyan-600/30 bg-cyan-100 text-cyan-800 hover:bg-cyan-200 ' +
         'dark:border-cyan-500/40 dark:bg-cyan-400/10 dark:text-cyan-400 dark:hover:bg-cyan-400/20',
  },
}
</script>

<template>
  <AppLayout>
    <NoAccess v-if="!auth.isAdmin" hint="此頁面僅限管理員分組使用" />

    <template v-else>
      <!-- Header -->
      <div class="space-y-3 mb-5">
        <div>
          <h2 class="font-bold text-slate-800 dark:text-slate-100">權限設定</h2>
          <p class="text-xs text-slate-600 mt-0.5 dark:text-slate-400">
            分組可自由增刪改；點格子輪替存取層級：不可存取 → 唯讀 → 可編輯
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button @click="openCreate" class="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5">
            <Plus class="w-3.5 h-3.5" />新增分組
          </button>

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
                  class="flex items-center gap-1 text-xs text-emerald-800 dark:text-emerald-400">
              <Check class="w-3.5 h-3.5" />已儲存
            </span>
          </Transition>

          <span v-if="error" class="text-xs text-red-700 dark:text-red-400">{{ error }}</span>

          <button
            @click="handleReset"
            class="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer
                   border border-slate-200 dark:border-dark-border
                   text-slate-600 dark:text-slate-400
                   hover:border-slate-300 dark:hover:border-slate-500
                   hover:text-slate-700 dark:hover:text-slate-200"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            還原預設
          </button>
        </div>
      </div>

      <!-- Permission matrix -->
      <div class="card overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 dark:border-dark-border">
              <th class="text-left px-5 py-3 text-xs font-medium text-slate-600 dark:text-slate-400 w-48">頁面</th>

              <th v-for="group in perms.editableGroups" :key="group.key" class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <Lock v-if="group.builtin" class="w-3.5 h-3.5 text-slate-600 dark:text-slate-400"
                        title="內建分組，不可刪除" />
                  <span class="text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    {{ group.label }}
                  </span>
                  <button @click="openRename(group)" title="改名"
                          class="cursor-pointer text-slate-600 hover:text-cyan-800 dark:text-slate-400 dark:hover:text-cyan-400">
                    <Pencil class="w-3 h-3" />
                  </button>
                  <button v-if="!group.builtin" @click="handleDelete(group)" title="刪除分組"
                          class="cursor-pointer text-slate-600 hover:text-red-700 dark:text-slate-400 dark:hover:text-red-400">
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
              </th>

              <th v-for="group in perms.adminGroups" :key="group.key" class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <Shield class="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
                  <span class="text-xs font-medium text-amber-800 dark:text-amber-400 whitespace-nowrap">
                    {{ group.label }}
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-dark-border">
            <tr v-for="page in PAGES" :key="page.key"
                class="hover:bg-slate-50 dark:hover:bg-dark-card transition-colors">
              <td class="px-5 py-4">
                <div class="font-medium text-slate-700 dark:text-slate-200 text-sm">{{ page.label }}</div>
                <div class="text-xs text-slate-600 font-mono mt-0.5 dark:text-slate-400">{{ page.route }}</div>
                <div v-if="page.editOnly" class="text-[10px] mt-1 text-slate-600 dark:text-slate-400">
                  整頁都是操作，沒有「唯讀」
                </div>
              </td>

              <td v-for="group in perms.editableGroups" :key="group.key" class="px-4 py-4 text-center">
                <button
                  @click="handleCycle(page.key, group.key)"
                  :title="`目前：${CELL[perms.levelOf(page.key, group.key)].label}，點擊切換下一階`"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border
                         text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap"
                  :class="CELL[perms.levelOf(page.key, group.key)].cls"
                >
                  <component :is="CELL[perms.levelOf(page.key, group.key)].icon" class="w-3.5 h-3.5" />
                  {{ CELL[perms.levelOf(page.key, group.key)].label }}
                </button>
              </td>

              <!-- 管理員分組固定全權，不可調整 -->
              <td v-for="group in perms.adminGroups" :key="group.key" class="px-4 py-4 text-center">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border
                             border-amber-400 bg-amber-100 text-amber-800
                             dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-400
                             text-[11px] font-medium cursor-not-allowed whitespace-nowrap"
                      title="管理員分組固定可編輯">
                  <Pencil class="w-3.5 h-3.5" />可編輯
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Note -->
      <p class="mt-3 text-xs text-slate-600 dark:text-slate-400">
        「唯讀」＝進得去頁面但所有修改按鈕都不出現；「可編輯」＝可以實際送出變更。
        這張表前後端都會檢查，改完立即生效。
        「未登入訪客」是所有沒登入的人所屬的分組，與管理員分組一樣內建、不可刪除；
        管理員固定擁有全部權限，帳號管理與權限設定頁面也僅限管理員。
      </p>

      <!-- 新增／改名分組 -->
      <div v-if="dialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="card p-6 w-full max-w-sm space-y-4">
          <h3 class="font-bold text-slate-800 dark:text-slate-100">
            {{ dialog.mode === 'create' ? '新增權限分組' : '分組改名' }}
          </h3>
          <div>
            <label class="label">分組名稱</label>
            <input v-model="dialog.label" class="input w-full" placeholder="例如：助教、系辦"
                   @keyup.enter="submitDialog" />
          </div>
          <p v-if="dialogError" class="text-xs text-red-700 dark:text-red-400">{{ dialogError }}</p>
          <div class="flex justify-end gap-2">
            <button class="btn-secondary" @click="dialog = null">取消</button>
            <button class="btn-primary" :disabled="busy" @click="submitDialog">
              {{ busy ? '儲存中…' : '儲存' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>
