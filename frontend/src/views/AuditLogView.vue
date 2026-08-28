<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import { api } from '@/lib/api'
import { History, ShieldOff, RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import StudentName from '@/components/common/StudentName.vue'
import GroupName from '@/components/common/GroupName.vue'

const auth = useAuthStore()
const data = useDataStore()

const logs = ref([])
const logsLoading = ref(false)
const logsError = ref('')

// ── Semantic event → label & color ────────────────────────────────
// 與 docs/異動紀錄種類.md 對齊；後端 audit.event() 寫入的 event key
const EVENT_META = {
  group_create:   { label: '建立組別',   color: 'emerald' },
  group_rename:   { label: '修改題目',   color: 'blue' },
  group_teachers: { label: '修改指導老師', color: 'blue' },
  group_leader:   { label: '設定組長',   color: 'blue' },
  group_category: { label: '修改類別',   color: 'blue' },
  group_delete:   { label: '解散組別',   color: 'red' },
  student_create: { label: '新增學生',   color: 'emerald' },
  student_join:   { label: '加入組別',   color: 'emerald' },
  student_move:   { label: '更換組別',   color: 'blue' },
  student_leave:  { label: '離開組別',   color: 'red' },
  student_status: { label: '休退學異動', color: 'amber' },
  teacher_create: { label: '新增老師',   color: 'emerald' },
}
const COLOR_CLASS = {
  emerald: 'text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
  blue:    'text-blue-700 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-900/15',
  red:     'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/15',
  amber:   'text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/15',
}
function opLabel(l) {
  return EVENT_META[l.event]?.label ?? l.event
}
function opColor(l) {
  return COLOR_CLASS[EVENT_META[l.event]?.color] ?? 'text-slate-600 dark:text-slate-400'
}

// ── Related-record name lookup（log 直接帶 student/teacher/group id）──
// 查不到（已刪除或尚未載入）一律回 null → 顯示「—」，避免把內部 id
// （s01 / t6…）直接秀給使用者；名稱資訊仍保留在「描述」欄。
function studentOf(l) {
  if (!l.student_id) return null
  const s = data.students.find((s) => s.id === l.student_id)
  return s ? `${s.name}（${s.student_id}）` : null
}
function teacherOf(l) {
  if (!l.teacher_id) return null
  return data.teachers.find((t) => t.id === l.teacher_id)?.name ?? null
}
function groupOf(l) {
  if (!l.group_id) return null
  const g = data.groups.find((g) => g.id === l.group_id)
  return g ? `第 ${g.number} 組 ${g.name}` : null
}

// ── Search (global, matches every column) ─────────────────────────
const keyword = ref('')

const filteredLogs = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return logs.value
  return logs.value.filter((l) =>
    [
      fmtTime(l.created_at),
      l.actor,
      opLabel(l),
      studentOf(l),
      teacherOf(l),
      groupOf(l),
      l.summary,
    ].some((v) => (v ?? '').toString().toLowerCase().includes(k))
  )
})

// ── Pagination ─────────────────────────────────────────────────────
const PAGE_SIZE = 50
const page = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredLogs.value.length / PAGE_SIZE)))
const pagedLogs = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filteredLogs.value.slice(start, start + PAGE_SIZE)
})
const pageStart = computed(() => (page.value - 1) * PAGE_SIZE + 1)
const pageEnd = computed(() => Math.min(page.value * PAGE_SIZE, filteredLogs.value.length))

watch(keyword, () => { page.value = 1 })
watch(totalPages, (n) => { if (page.value > n) page.value = n })

// ── Load ──────────────────────────────────────────────────────────
async function loadLogs() {
  logsLoading.value = true
  logsError.value = ''
  try {
    // 後端預設只回 200 筆、上限 500 — 明確要滿額，避免分頁少資料
    logs.value = await api.get('/audit-logs?limit=500')
  } catch (e) {
    logsError.value = e.message ?? '載入異動紀錄失敗'
  } finally {
    logsLoading.value = false
  }
}

onMounted(() => {
  if (auth.isEditor) {
    data.loadAll()
    loadLogs()
  }
})

function fmtTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
</script>

<template>
  <AppLayout>
    <div v-if="!auth.isEditor"
         class="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#2a3347] flex items-center justify-center">
        <ShieldOff class="w-6 h-6 text-slate-600 dark:text-slate-400" />
      </div>
      <p class="font-semibold text-slate-700 dark:text-slate-300">無編輯權限</p>
      <p class="text-sm text-slate-600 dark:text-slate-400">此頁面僅限編輯者使用</p>
    </div>

    <div v-else class="w-full space-y-4">
      <!-- header -->
      <div class="space-y-3">
        <div>
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <History class="w-5 h-5 text-blue-700 dark:text-cyan-400" /> 異動紀錄
          </h2>
          <p class="text-xs text-slate-600 mt-0.5 dark:text-slate-400">
            <template v-if="keyword.trim()">符合 {{ filteredLogs.length }} 筆 / 共 {{ logs.length }} 筆</template>
            <template v-else>共 {{ logs.length }} 筆</template>
          </p>
        </div>
        <button
          class="text-xs text-slate-600 hover:text-blue-600 dark:hover:text-cyan-400
                 flex items-center gap-1 cursor-pointer dark:text-slate-400"
          @click="loadLogs"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="logsLoading ? 'animate-spin' : ''" />
          重新整理
        </button>
      </div>

      <!-- search -->
      <div class="relative">
        <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none dark:text-slate-400" />
        <input v-model="keyword" class="input w-64 text-xs !pl-8" placeholder="搜尋全部欄位" />
      </div>

      <!-- table -->
      <div class="card p-0 overflow-hidden">
        <p v-if="logsError" class="px-5 py-4 text-xs text-red-700 dark:text-red-400">{{ logsError }}</p>
        <p v-else-if="logsLoading && !logs.length"
           class="px-5 py-10 text-center text-sm text-slate-600 dark:text-slate-400">載入中…</p>
        <p v-else-if="!logs.length"
           class="px-5 py-10 text-center text-sm text-slate-600 dark:text-slate-400">尚無異動紀錄</p>

        <template v-else>
          <table class="w-full table-fixed text-sm">
            <thead class="border-b border-slate-100 dark:border-[#2a3347] text-xs text-slate-600 dark:text-slate-400">
              <tr>
                <th class="text-left px-5 py-2.5 font-medium w-40">時間</th>
                <th class="text-left px-3 py-2.5 font-medium w-24">操作者</th>
                <th class="text-left px-3 py-2.5 font-medium w-32">操作</th>
                <th class="text-left px-3 py-2.5 font-medium w-44">學生</th>
                <th class="text-left px-3 py-2.5 font-medium w-28">老師</th>
                <th class="text-left px-3 py-2.5 font-medium w-40">組別</th>
                <th class="text-left px-3 py-2.5 font-medium">描述</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-[#1e2535]">
              <tr v-if="!filteredLogs.length">
                <td colspan="7" class="px-5 py-10 text-center text-sm text-slate-600 dark:text-slate-400">
                  沒有符合的紀錄
                </td>
              </tr>
              <tr
                v-for="l in pagedLogs"
                :key="l.id"
                class="hover:bg-slate-50 dark:hover:bg-[#1a2235]"
              >
                <td class="px-5 py-2.5 text-xs text-slate-600 whitespace-nowrap dark:text-slate-400">
                  {{ fmtTime(l.created_at) }}
                </td>
                <td class="px-3 py-2.5 text-slate-600 dark:text-slate-300 font-mono text-xs truncate">
                  {{ l.actor }}
                </td>
                <td class="px-3 py-2.5 whitespace-nowrap">
                  <span class="px-2 py-0.5 rounded-md text-xs font-medium" :class="opColor(l)">
                    {{ opLabel(l) }}
                  </span>
                </td>
                <td class="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 truncate">
                  <StudentName v-if="studentOf(l)" :id="l.student_id" :name="studentOf(l)" />
                  <template v-else>—</template>
                </td>
                <td class="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 truncate">
                  {{ teacherOf(l) ?? '—' }}
                </td>
                <td class="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 truncate">
                  <GroupName v-if="groupOf(l)" :id="l.group_id" :label="groupOf(l)" />
                  <template v-else>—</template>
                </td>
                <td class="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-400 truncate">
                  {{ l.summary ?? '—' }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- pagination (固定顯示，搜尋時版面不跳動) -->
          <div
            class="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-[#2a3347]"
          >
            <p class="text-xs text-slate-600 dark:text-slate-400">
              <template v-if="filteredLogs.length">
                顯示第 {{ pageStart }}–{{ pageEnd }} 筆 · 第 {{ page }} / {{ totalPages }} 頁
              </template>
              <template v-else>0 筆</template>
            </p>
            <div class="flex items-center gap-1.5">
              <button
                :disabled="page === 1"
                @click="page--"
                class="px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 cursor-pointer
                       bg-white dark:bg-[#1e2535] text-slate-600 dark:text-slate-400
                       border-slate-200 dark:border-[#2a3347] hover:border-slate-300
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200"
              >
                <ChevronLeft class="w-3.5 h-3.5" /> 上一頁
              </button>
              <button
                :disabled="page === totalPages"
                @click="page++"
                class="px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 cursor-pointer
                       bg-white dark:bg-[#1e2535] text-slate-600 dark:text-slate-400
                       border-slate-200 dark:border-[#2a3347] hover:border-slate-300
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200"
              >
                下一頁 <ChevronRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </AppLayout>
</template>
