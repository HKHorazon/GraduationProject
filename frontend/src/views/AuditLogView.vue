<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'
import { History, ShieldOff, RefreshCw, Search } from 'lucide-vue-next'

const auth = useAuthStore()

const logs = ref([])
const logsLoading = ref(false)
const logsError = ref('')

const ACTION_LABEL = { create: '新增', update: '修改', delete: '刪除', import: '匯入' }
const ACTION_CLASS = {
  create: 'text-emerald-600 dark:text-emerald-400',
  update: 'text-blue-600 dark:text-cyan-400',
  delete: 'text-red-500 dark:text-red-400',
  import: 'text-violet-600 dark:text-violet-400',
}
const ENTITY_LABEL = { student: '學生', group: '組別', teacher: '老師', account: '帳號' }

const filterAction = ref('')
const filterEntity = ref('')
const keyword = ref('')

const filteredLogs = computed(() => {
  let list = logs.value
  if (filterAction.value) list = list.filter((l) => l.action === filterAction.value)
  if (filterEntity.value) list = list.filter((l) => l.entity === filterEntity.value)
  if (keyword.value.trim()) {
    const k = keyword.value.trim().toLowerCase()
    list = list.filter((l) =>
      (l.actor ?? '').toLowerCase().includes(k) ||
      (l.summary ?? '').toLowerCase().includes(k)
    )
  }
  return list
})

async function loadLogs() {
  logsLoading.value = true
  logsError.value = ''
  try {
    logs.value = await api.get('/audit-logs')
  } catch (e) {
    logsError.value = e.message ?? '載入異動紀錄失敗'
  } finally {
    logsLoading.value = false
  }
}

function fmtTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

onMounted(() => { if (auth.isEditor) loadLogs() })
</script>

<template>
  <AppLayout>
    <div v-if="!auth.isEditor" class="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#2a3347] flex items-center justify-center">
        <ShieldOff class="w-6 h-6 text-slate-400" />
      </div>
      <p class="font-semibold text-slate-700 dark:text-slate-300">無編輯權限</p>
      <p class="text-sm text-slate-400">此頁面僅限編輯者使用</p>
    </div>

    <div v-else class="w-full space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <History class="w-5 h-5 text-blue-600 dark:text-cyan-400" /> 異動紀錄
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">共 {{ filteredLogs.length }} 筆</p>
        </div>
        <button class="text-xs text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
                @click="loadLogs">
          <RefreshCw class="w-3.5 h-3.5" :class="logsLoading ? 'animate-spin' : ''" /> 重新整理
        </button>
      </div>

      <!-- filters -->
      <div class="flex gap-2 flex-wrap">
        <div class="relative">
          <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input v-model="keyword" class="input w-56 text-xs pl-8" placeholder="搜尋操作者 / 內容" />
        </div>
        <select v-model="filterAction" class="input w-28 text-xs">
          <option value="">動作（全部）</option>
          <option value="create">新增</option>
          <option value="update">修改</option>
          <option value="delete">刪除</option>
          <option value="import">匯入</option>
        </select>
        <select v-model="filterEntity" class="input w-28 text-xs">
          <option value="">對象（全部）</option>
          <option value="student">學生</option>
          <option value="group">組別</option>
          <option value="teacher">老師</option>
          <option value="account">帳號</option>
        </select>
      </div>

      <div class="card p-0 overflow-hidden">
        <p v-if="logsError" class="px-5 py-4 text-xs text-red-500">{{ logsError }}</p>
        <p v-else-if="logsLoading && !logs.length" class="px-5 py-10 text-center text-sm text-slate-400">載入中…</p>
        <p v-else-if="!filteredLogs.length" class="px-5 py-10 text-center text-sm text-slate-400">尚無異動紀錄</p>

        <table v-else class="w-full text-sm">
          <thead class="border-b border-slate-100 dark:border-[#2a3347] text-xs text-slate-400">
            <tr>
              <th class="text-left px-5 py-2 font-medium">時間</th>
              <th class="text-left px-3 py-2 font-medium">操作者</th>
              <th class="text-left px-3 py-2 font-medium">動作</th>
              <th class="text-left px-3 py-2 font-medium">對象</th>
              <th class="text-left px-3 py-2 font-medium">內容</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-[#1e2535]">
            <tr v-for="l in filteredLogs" :key="l.id" class="hover:bg-slate-50 dark:hover:bg-[#1a2235]">
              <td class="px-5 py-2 text-xs text-slate-400 whitespace-nowrap">{{ fmtTime(l.created_at) }}</td>
              <td class="px-3 py-2 text-slate-600 dark:text-slate-300">{{ l.actor }}</td>
              <td class="px-3 py-2 font-medium whitespace-nowrap" :class="ACTION_CLASS[l.action]">
                {{ ACTION_LABEL[l.action] ?? l.action }}
              </td>
              <td class="px-3 py-2 text-slate-500 whitespace-nowrap">{{ ENTITY_LABEL[l.entity] ?? l.entity }}</td>
              <td class="px-3 py-2 text-slate-600 dark:text-slate-300">{{ l.summary }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>
