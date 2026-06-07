<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import { api } from '@/lib/api'
import {
  UserPlus, Upload, GraduationCap, History, ShieldOff, Check, FileSpreadsheet, X, RefreshCw,
} from 'lucide-vue-next'

const auth = useAuthStore()
const data = useDataStore()

onMounted(() => { data.loadAll() })

const years = computed(() =>
  [...new Set(data.students.map((s) => s.school_year))].sort().reverse()
)
const classes = computed(() =>
  [...new Set(data.students.map((s) => s.class_).filter(Boolean))]
)

const TABS = [
  { key: 'student', label: '新增學生', icon: UserPlus },
  { key: 'bulk', label: '批次匯入', icon: Upload },
  { key: 'teacher', label: '新增老師', icon: GraduationCap },
  { key: 'audit', label: '異動紀錄', icon: History },
]
const tab = ref('student')

function flash(msgRef) {
  return (text) => {
    msgRef.value = text
    setTimeout(() => { if (msgRef.value === text) msgRef.value = '' }, 2500)
  }
}

// ───────── 新增學生 (single) ─────────
const sForm = ref({ student_id: '', name: '', class_: '', school_year: '', status: 'active' })
const sError = ref('')
const sOk = ref('')
const sBusy = ref(false)
const showOk = flash(sOk)

function resetStudentForm() {
  sForm.value = {
    student_id: '', name: '', class_: '',
    school_year: years.value[0] || '', status: 'active',
  }
}

async function submitStudent() {
  sError.value = ''
  if (!sForm.value.student_id.trim()) { sError.value = '請填寫學號'; return }
  if (!sForm.value.name.trim()) { sError.value = '請填寫姓名'; return }
  if (!sForm.value.school_year.trim()) { sError.value = '請填寫學年度'; return }
  if (sBusy.value) return
  sBusy.value = true
  try {
    const s = await data.createStudent({
      student_id: sForm.value.student_id.trim(),
      name: sForm.value.name.trim(),
      class_: sForm.value.class_.trim() || null,
      school_year: sForm.value.school_year.trim(),
      status: sForm.value.status,
      group_id: null,
    })
    showOk(`已新增學生：${s.name}（${s.student_id}）`)
    resetStudentForm()
  } catch (e) {
    sError.value = e.message ?? '新增失敗'
  } finally {
    sBusy.value = false
  }
}

// ───────── 新增老師 ─────────
const tName = ref('')
const tError = ref('')
const tOk = ref('')
const tBusy = ref(false)
const showTOk = flash(tOk)

async function submitTeacher() {
  tError.value = ''
  if (!tName.value.trim()) { tError.value = '請填寫老師姓名'; return }
  if (tBusy.value) return
  tBusy.value = true
  try {
    const t = await data.createTeacher(tName.value.trim())
    showTOk(`已新增老師：${t.name}`)
    tName.value = ''
  } catch (e) {
    tError.value = e.message ?? '新增失敗'
  } finally {
    tBusy.value = false
  }
}

// ───────── 批次匯入 (Excel / CSV) ─────────
const HEADER_MAP = {
  student_id: ['學號', 'student_id', 'studentid', 'id'],
  name: ['姓名', 'name'],
  class_: ['班級', '班別', 'class'],
  school_year: ['學年度', '學年', 'school_year', 'schoolyear', 'year'],
  status: ['狀態', 'status'],
}
function mapKey(raw) {
  const k = String(raw).trim().toLowerCase()
  for (const [field, aliases] of Object.entries(HEADER_MAP)) {
    if (aliases.some((a) => a.toLowerCase() === k)) return field
  }
  return null
}
function normStatus(v) {
  const s = String(v ?? '').trim()
  if (!s) return 'active'
  return /休|退|inactive|停/i.test(s) ? 'inactive' : 'active'
}

const bulkRows = ref([])
const bulkFileName = ref('')
const bulkError = ref('')
const bulkOk = ref('')
const bulkBusy = ref(false)
const showBulkOk = flash(bulkOk)
const fileInput = ref(null)

const validRows = computed(() => bulkRows.value.filter((r) => !r._error))
const hasErrors = computed(() => bulkRows.value.some((r) => r._error))

function clearBulk() {
  bulkRows.value = []
  bulkFileName.value = ''
  bulkError.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function onFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  bulkError.value = ''
  bulkFileName.value = file.name
  try {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })
    if (!raw.length) { bulkError.value = '檔案沒有資料列'; bulkRows.value = []; return }

    const existingSids = new Set(data.students.map((s) => s.student_id))
    const seen = new Set()
    bulkRows.value = raw.map((obj) => {
      const row = { student_id: '', name: '', class_: '', school_year: '', status: 'active' }
      for (const [k, v] of Object.entries(obj)) {
        const field = mapKey(k)
        if (field === 'status') row.status = normStatus(v)
        else if (field) row[field] = String(v).trim()
      }
      let err = ''
      if (!row.student_id) err = '缺少學號'
      else if (!row.name) err = '缺少姓名'
      else if (!row.school_year) err = '缺少學年度'
      else if (existingSids.has(row.student_id) || seen.has(row.student_id)) err = '學號重複'
      if (row.student_id) seen.add(row.student_id)
      return { ...row, _error: err }
    })
  } catch (err) {
    bulkError.value = '無法讀取檔案：' + (err.message ?? '格式錯誤')
    bulkRows.value = []
  }
}

async function importBulk() {
  if (!validRows.value.length || bulkBusy.value) return
  bulkBusy.value = true
  bulkError.value = ''
  try {
    const payload = validRows.value.map((r) => ({
      student_id: r.student_id,
      name: r.name,
      class_: r.class_ || null,
      school_year: r.school_year,
      status: r.status,
      group_id: null,
    }))
    const created = await data.bulkCreateStudents(payload)
    showBulkOk(`成功匯入 ${created.length} 位學生`)
    clearBulk()
  } catch (e) {
    bulkError.value = e.message ?? '匯入失敗'
  } finally {
    bulkBusy.value = false
  }
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['學號', '姓名', '班級', '學年度', '狀態'],
    ['A12345', '王小明', '三甲', '114', '在學'],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '學生')
  XLSX.writeFile(wb, '學生匯入範本.xlsx')
}

// ───────── 異動紀錄 (audit log) ─────────
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

watch(tab, (t) => { if (t === 'audit' && !logs.value.length) loadLogs() })
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

    <div v-else class="max-w-3xl space-y-5">
      <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">資料管理</h2>

      <!-- tabs -->
      <div class="flex gap-1 border-b border-slate-200 dark:border-[#2a3347]">
        <button
          v-for="t in TABS" :key="t.key" @click="tab = t.key"
          class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors cursor-pointer"
          :class="tab === t.key
            ? 'border-blue-500 dark:border-cyan-400 text-blue-600 dark:text-cyan-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
        >
          <component :is="t.icon" class="w-4 h-4" /> {{ t.label }}
        </button>
      </div>

      <!-- 新增學生 -->
      <div v-show="tab === 'student'" class="card p-6">
        <form @submit.prevent="submitStudent" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">學號 <span class="text-red-400">*</span></label>
              <input v-model="sForm.student_id" class="input" placeholder="例如 A12345" />
            </div>
            <div>
              <label class="label">姓名 <span class="text-red-400">*</span></label>
              <input v-model="sForm.name" class="input" placeholder="王小明" />
            </div>
            <div>
              <label class="label">班級</label>
              <input v-model="sForm.class_" list="dv-classes" class="input" placeholder="甲" />
              <datalist id="dv-classes"><option v-for="c in classes" :key="c" :value="c" /></datalist>
            </div>
            <div>
              <label class="label">學年度 <span class="text-red-400">*</span></label>
              <input v-model="sForm.school_year" list="dv-years" class="input" placeholder="114" />
              <datalist id="dv-years"><option v-for="y in years" :key="y" :value="y" /></datalist>
            </div>
            <div>
              <label class="label">狀態</label>
              <select v-model="sForm.status" class="input">
                <option value="active">在學</option>
                <option value="inactive">休退學</option>
              </select>
            </div>
          </div>
          <p v-if="sError" class="text-xs text-red-500">{{ sError }}</p>
          <p v-if="sOk" class="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Check class="w-3.5 h-3.5" />{{ sOk }}</p>
          <div class="flex justify-end">
            <button type="submit" class="btn-primary flex items-center gap-1.5" :disabled="sBusy">
              <UserPlus class="w-4 h-4" /> {{ sBusy ? '新增中…' : '新增學生' }}
            </button>
          </div>
        </form>
        <p class="text-xs text-slate-400 mt-3">新增的學生預設為未分組，分組請至「學生更動」頁面操作。</p>
      </div>

      <!-- 批次匯入 -->
      <div v-show="tab === 'bulk'" class="card p-6 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onFile" />
            <button class="btn-secondary flex items-center gap-1.5" @click="fileInput?.click()">
              <FileSpreadsheet class="w-4 h-4" /> 選擇 Excel / CSV
            </button>
            <span v-if="bulkFileName" class="text-xs text-slate-500 flex items-center gap-1">
              {{ bulkFileName }}
              <button @click="clearBulk" class="text-slate-400 hover:text-red-500 cursor-pointer"><X class="w-3.5 h-3.5" /></button>
            </span>
          </div>
          <button class="text-xs text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer" @click="downloadTemplate">
            下載範本
          </button>
        </div>

        <p class="text-xs text-slate-400">
          欄位：學號、姓名、班級、學年度、狀態（在學/休退學）。學號、姓名、學年度為必填。
        </p>

        <p v-if="bulkError" class="text-xs text-red-500">{{ bulkError }}</p>

        <div v-if="bulkRows.length" class="border border-slate-200 dark:border-[#2a3347] rounded-lg overflow-hidden">
          <div class="max-h-72 overflow-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 dark:bg-[#161b27] sticky top-0">
                <tr class="text-xs text-slate-400">
                  <th class="text-left px-3 py-2">#</th>
                  <th class="text-left px-3 py-2">學號</th>
                  <th class="text-left px-3 py-2">姓名</th>
                  <th class="text-left px-3 py-2">班級</th>
                  <th class="text-left px-3 py-2">學年度</th>
                  <th class="text-left px-3 py-2">狀態</th>
                  <th class="text-left px-3 py-2">檢查</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-[#2a3347]">
                <tr v-for="(r, i) in bulkRows" :key="i" :class="r._error ? 'bg-red-50 dark:bg-red-900/10' : ''">
                  <td class="px-3 py-1.5 text-slate-400 text-xs">{{ i + 1 }}</td>
                  <td class="px-3 py-1.5 id-mono">{{ r.student_id }}</td>
                  <td class="px-3 py-1.5">{{ r.name }}</td>
                  <td class="px-3 py-1.5 text-slate-500">{{ r.class_ }}</td>
                  <td class="px-3 py-1.5 text-slate-500">{{ r.school_year }}</td>
                  <td class="px-3 py-1.5 text-slate-500">{{ r.status === 'inactive' ? '休退學' : '在學' }}</td>
                  <td class="px-3 py-1.5 text-xs">
                    <span v-if="r._error" class="text-red-500">{{ r._error }}</span>
                    <span v-else class="text-emerald-600 dark:text-emerald-400">OK</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="bulkRows.length" class="flex items-center justify-between">
          <p class="text-xs text-slate-500">
            可匯入 <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{ validRows.length }}</span> 筆
            <span v-if="hasErrors" class="text-red-500">・{{ bulkRows.length - validRows.length }} 筆有誤(將略過)</span>
          </p>
          <button class="btn-primary flex items-center gap-1.5" :disabled="!validRows.length || bulkBusy" @click="importBulk">
            <Upload class="w-4 h-4" /> {{ bulkBusy ? '匯入中…' : `匯入 ${validRows.length} 筆` }}
          </button>
        </div>

        <p v-if="bulkOk" class="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Check class="w-3.5 h-3.5" />{{ bulkOk }}</p>
      </div>

      <!-- 新增老師 -->
      <div v-show="tab === 'teacher'" class="card p-6">
        <form @submit.prevent="submitTeacher" class="space-y-4">
          <div>
            <label class="label">老師姓名 <span class="text-red-400">*</span></label>
            <input v-model="tName" class="input" placeholder="陳老師" />
          </div>
          <p v-if="tError" class="text-xs text-red-500">{{ tError }}</p>
          <p v-if="tOk" class="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Check class="w-3.5 h-3.5" />{{ tOk }}</p>
          <div class="flex justify-end">
            <button type="submit" class="btn-primary flex items-center gap-1.5" :disabled="tBusy">
              <GraduationCap class="w-4 h-4" /> {{ tBusy ? '新增中…' : '新增老師' }}
            </button>
          </div>
        </form>

        <div class="mt-5 pt-4 border-t border-slate-100 dark:border-[#2a3347]">
          <p class="text-xs text-slate-400 mb-2">目前老師（{{ data.teachers.length }}）</p>
          <div class="flex flex-wrap gap-2">
            <span v-for="t in data.teachers" :key="t.id"
                  class="px-2.5 py-1 rounded-full text-sm bg-slate-100 dark:bg-[#2a3347] text-slate-600 dark:text-slate-300">
              {{ t.name }}
            </span>
          </div>
        </div>
      </div>

      <!-- 異動紀錄 -->
      <div v-show="tab === 'audit'" class="card p-0 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-[#2a3347]">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-300">最近異動紀錄</p>
          <button class="text-xs text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
                  @click="loadLogs">
            <RefreshCw class="w-3.5 h-3.5" :class="logsLoading ? 'animate-spin' : ''" /> 重新整理
          </button>
        </div>

        <p v-if="logsError" class="px-5 py-4 text-xs text-red-500">{{ logsError }}</p>
        <p v-else-if="logsLoading && !logs.length" class="px-5 py-10 text-center text-sm text-slate-400">載入中…</p>
        <p v-else-if="!logs.length" class="px-5 py-10 text-center text-sm text-slate-400">尚無異動紀錄</p>

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
            <tr v-for="l in logs" :key="l.id" class="hover:bg-slate-50 dark:hover:bg-[#1a2235]">
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
