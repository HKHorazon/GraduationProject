<script setup>
import { ref, computed, onMounted } from 'vue'
import XLSX from 'xlsx-js-style'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore } from '@/stores/permissions'
import NoAccess from '@/components/common/NoAccess.vue'
import { useDataStore } from '@/stores/data'
import { rocYear } from '@/lib/year'
import { studentRows, groupRows, buildWorkbook, exportFileName } from '@/lib/exportSheets'
import {
  UserPlus, Upload, GraduationCap, Check, FileSpreadsheet, X,
  LayoutDashboard, FolderPlus, Users, LayoutList, Download, ArrowUpNarrowWide,
} from 'lucide-vue-next'

const auth = useAuthStore()
const perms = usePermissionsStore()
const data = useDataStore()

onMounted(() => { data.loadAll() })

const years = computed(() =>
  [...new Set(data.students.map((s) => s.school_year))].sort().reverse()
)
const classes = computed(() =>
  [...new Set(data.students.map((s) => s.class_).filter(Boolean))]
)

const TABS = computed(() => [
  { key: 'overview', label: '總覽', icon: LayoutDashboard },
  { key: 'student', label: '新增學生', icon: UserPlus },
  { key: 'bulk', label: '批次匯入學生', icon: Upload },
  { key: 'group', label: '新增組別', icon: FolderPlus },
  { key: 'teacher', label: '新增老師', icon: GraduationCap },
  // 全體升級會動到所有學生，只開給 super_admin
  ...(auth.isAdmin ? [{ key: 'promote', label: '全體升級', icon: ArrowUpNarrowWide }] : []),
])
const tab = ref('overview')

// --- 全體升級 ---
const promoteBusy = ref(false)
const promoteMessage = ref('')
const promoteError = ref('')

async function promoteAll() {
  promoteMessage.value = ''
  promoteError.value = ''
  const n = data.students.length
  if (!confirm(`確定將全部 ${n} 位學生升一個年級？三年級 → 四年級，四年級改為「甲(畢業)」。此動作無法復原。`)) return
  promoteBusy.value = true
  try {
    const r = await data.promoteStudents()
    promoteMessage.value = `已升級 ${r.promoted} 位、畢業 ${r.graduated} 位、跳過 ${r.skipped} 位。`
  } catch (e) {
    promoteError.value = e.message || '升級失敗'
  } finally {
    promoteBusy.value = false
  }
}

function flash(msgRef) {
  return (text) => {
    msgRef.value = text
    setTimeout(() => { if (msgRef.value === text) msgRef.value = '' }, 2500)
  }
}

function toRoc(y) {
  return `${rocYear(y)} 學年`
}

// ───────── 總覽 (overview) ─────────
const stats = computed(() => {
  const s = data.students
  const active = s.filter((x) => x.status === 'active').length
  const grouped = s.filter((x) => x.group_id).length
  return {
    students: s.length,
    active,
    inactive: s.length - active,
    grouped,
    ungrouped: s.length - grouped,
    groups: data.groups.length,
    teachers: data.teachers.length,
    years: years.value.length,
  }
})

const byYear = computed(() =>
  years.value.map((y) => ({
    year: y,
    students: data.students.filter((s) => s.school_year === y).length,
    groups: data.groups.filter((g) => g.school_year === y).length,
  }))
)

function exportStudents() {
  const sheets = {}
  for (const y of years.value) {
    sheets[`${rocYear(y)}學年`] = studentRows(
      data.students.filter((s) => s.school_year === y),
      { groups: data.groups, teachers: data.teachers },
    )
  }
  XLSX.writeFile(buildWorkbook(sheets), exportFileName('學生資料'))
}

function exportGroups() {
  const sheets = {}
  const groupYears = [...new Set(data.groups.map((g) => g.school_year))].sort().reverse()
  for (const y of groupYears) {
    sheets[`${rocYear(y)}學年`] = groupRows(
      data.groups.filter((g) => g.school_year === y).sort((a, b) => a.number - b.number),
      { students: data.students, teachers: data.teachers },
    )
  }
  XLSX.writeFile(buildWorkbook(sheets), exportFileName('組別資料'))
}

// ───────── 新增學生 (single) ─────────
const sForm = ref({ student_id: '', name: '', class_: '', school_year: '' })
const sError = ref('')
const sOk = ref('')
const sBusy = ref(false)
const showOk = flash(sOk)

function resetStudentForm() {
  sForm.value = { student_id: '', name: '', class_: '', school_year: years.value[0] || '' }
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
      status: 'active',
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

// ───────── 新增組別 ─────────
const gForm = ref({ school_year: '', number: '', name: '', category: '', teacher_ids: [] })
const gError = ref('')
const gOk = ref('')
const gBusy = ref(false)
const showGOk = flash(gOk)

function resetGroupForm() {
  gForm.value = { school_year: years.value[0] || '', number: '', name: '', category: '', teacher_ids: [] }
}

function toggleGroupTeacher(id) {
  const arr = gForm.value.teacher_ids
  const i = arr.indexOf(id)
  if (i === -1) arr.push(id)
  else arr.splice(i, 1)
}

async function submitGroup() {
  gError.value = ''
  if (!gForm.value.school_year.trim()) { gError.value = '請填寫學年度'; return }
  if (!String(gForm.value.number).trim()) { gError.value = '請填寫組號'; return }
  if (!gForm.value.name.trim()) { gError.value = '請填寫專題名稱'; return }
  if (gBusy.value) return
  gBusy.value = true
  try {
    const g = await data.createGroup({
      number: parseInt(gForm.value.number, 10),
      name: gForm.value.name.trim(),
      category: gForm.value.category.trim() || null,
      school_year: gForm.value.school_year.trim(),
      leader_id: null,
      teacher_ids: [...gForm.value.teacher_ids],
    })
    showGOk(`已新增組別：第 ${g.number} 組 ${g.name}`)
    resetGroupForm()
  } catch (e) {
    gError.value = e.message ?? '新增失敗'
  } finally {
    gBusy.value = false
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
        if (field && field !== 'status') row[field] = String(v).trim()
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
    ['學號', '姓名', '班級', '學年度'],
    ['A12345', '王小明', '甲', '114'],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '學生')
  XLSX.writeFile(wb, '學生匯入範本.xlsx')
}

</script>

<template>
  <AppLayout>
    <NoAccess v-if="!perms.canEdit('data', auth.role)"
                hint="此頁面只有操作功能，需要「可編輯」權限，請洽系統管理員" />

    <div v-else class="w-full space-y-5">
      <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">資料管理</h2>

      <!-- tabs -->
      <div class="flex gap-1 border-b border-slate-200 dark:border-[#2a3347] overflow-x-auto">
        <button
          v-for="t in TABS" :key="t.key" @click="tab = t.key"
          class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors cursor-pointer whitespace-nowrap"
          :class="tab === t.key
            ? 'border-blue-500 dark:border-cyan-400 text-blue-700 dark:text-cyan-400'
            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'"
        >
          <component :is="t.icon" class="w-4 h-4" /> {{ t.label }}
        </button>
      </div>

      <!-- 總覽 -->
      <div v-show="tab === 'overview'" class="space-y-5">
        <!-- stat cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="card p-5">
            <div class="flex items-center gap-2 text-slate-600 text-xs mb-1 dark:text-slate-400">
              <Users class="w-4 h-4" /> 學生總數
            </div>
            <p class="text-2xl font-bold text-slate-800 dark:text-slate-100">{{ stats.students }}</p>
            <p class="text-xs text-slate-600 mt-1 dark:text-slate-400">在學 {{ stats.active }}・休退學／抵免 {{ stats.inactive }}</p>
          </div>
          <div class="card p-5">
            <div class="flex items-center gap-2 text-slate-600 text-xs mb-1 dark:text-slate-400">
              <LayoutList class="w-4 h-4" /> 組別總數
            </div>
            <p class="text-2xl font-bold text-slate-800 dark:text-slate-100">{{ stats.groups }}</p>
            <p class="text-xs text-slate-600 mt-1 dark:text-slate-400">已分組 {{ stats.grouped }}・未分組 {{ stats.ungrouped }}</p>
          </div>
          <div class="card p-5">
            <div class="flex items-center gap-2 text-slate-600 text-xs mb-1 dark:text-slate-400">
              <GraduationCap class="w-4 h-4" /> 老師總數
            </div>
            <p class="text-2xl font-bold text-slate-800 dark:text-slate-100">{{ stats.teachers }}</p>
            <p class="text-xs text-slate-600 mt-1 dark:text-slate-400">指導老師</p>
          </div>
          <div class="card p-5">
            <div class="flex items-center gap-2 text-slate-600 text-xs mb-1 dark:text-slate-400">
              <LayoutDashboard class="w-4 h-4" /> 學年度數
            </div>
            <p class="text-2xl font-bold text-slate-800 dark:text-slate-100">{{ stats.years }}</p>
            <p class="text-xs text-slate-600 mt-1 dark:text-slate-400">涵蓋學年</p>
          </div>
        </div>

        <!-- by year + export -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div class="card p-0 overflow-hidden lg:col-span-2">
            <div class="px-5 py-3 border-b border-slate-100 dark:border-[#2a3347]">
              <p class="text-sm font-medium text-slate-600 dark:text-slate-300">各學年度統計</p>
            </div>
            <table class="w-full text-sm">
              <thead class="border-b border-slate-100 dark:border-[#2a3347] text-xs text-slate-600 dark:text-slate-400">
                <tr>
                  <th class="text-left px-5 py-2 font-medium">學年度</th>
                  <th class="text-left px-3 py-2 font-medium">學生數</th>
                  <th class="text-left px-3 py-2 font-medium">組別數</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50 dark:divide-[#1e2535]">
                <tr v-for="r in byYear" :key="r.year" class="hover:bg-slate-50 dark:hover:bg-[#1a2235]">
                  <td class="px-5 py-2 text-slate-600 dark:text-slate-300">{{ toRoc(r.year) }}</td>
                  <td class="px-3 py-2 text-slate-600 dark:text-slate-300">{{ r.students }}</td>
                  <td class="px-3 py-2 text-slate-600 dark:text-slate-300">{{ r.groups }}</td>
                </tr>
                <tr v-if="!byYear.length">
                  <td colspan="3" class="px-5 py-8 text-center text-sm text-slate-600 dark:text-slate-400">尚無資料</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="card p-5 space-y-3">
            <p class="text-sm font-medium text-slate-600 dark:text-slate-300">匯出資料</p>
            <p class="text-xs text-slate-600 dark:text-slate-400">將目前資料匯出為 Excel 檔案，方便備份或交接。</p>
            <button class="btn-secondary w-full flex items-center justify-center gap-1.5" @click="exportStudents">
              <Download class="w-4 h-4" /> 匯出學生（{{ stats.students }}）
            </button>
            <button class="btn-secondary w-full flex items-center justify-center gap-1.5" @click="exportGroups">
              <Download class="w-4 h-4" /> 匯出組別（{{ stats.groups }}）
            </button>
          </div>
        </div>
      </div>

      <!-- 新增學生 -->
      <div v-show="tab === 'student'" class="card p-6">
        <form @submit.prevent="submitStudent" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">學號 <span class="text-red-700 dark:text-red-400">*</span></label>
              <input v-model="sForm.student_id" class="input" placeholder="例如 A12345" />
            </div>
            <div>
              <label class="label">姓名 <span class="text-red-700 dark:text-red-400">*</span></label>
              <input v-model="sForm.name" class="input" placeholder="王小明" />
            </div>
            <div>
              <label class="label">班級</label>
              <input v-model="sForm.class_" list="dv-classes" class="input" placeholder="甲" />
              <datalist id="dv-classes"><option v-for="c in classes" :key="c" :value="c" /></datalist>
            </div>
            <div>
              <label class="label">學年度 <span class="text-red-700 dark:text-red-400">*</span></label>
              <input v-model="sForm.school_year" list="dv-years" class="input" placeholder="114" />
              <datalist id="dv-years"><option v-for="y in years" :key="y" :value="y" /></datalist>
            </div>
          </div>
          <p v-if="sError" class="text-xs text-red-700 dark:text-red-400">{{ sError }}</p>
          <p v-if="sOk" class="text-xs text-emerald-800 dark:text-emerald-400 flex items-center gap-1"><Check class="w-3.5 h-3.5" />{{ sOk }}</p>
          <div class="flex">
            <button type="submit" class="btn-primary flex items-center gap-1.5" :disabled="sBusy">
              <UserPlus class="w-4 h-4" /> {{ sBusy ? '新增中…' : '新增學生' }}
            </button>
          </div>
        </form>
        <p class="text-xs text-slate-600 mt-3 dark:text-slate-400">新增的學生預設為未分組，分組請至「學生更動」頁面操作。</p>
      </div>

      <!-- 新增組別 -->
      <div v-show="tab === 'group'" class="card p-6">
        <form @submit.prevent="submitGroup" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">學年度 <span class="text-red-700 dark:text-red-400">*</span></label>
              <input v-model="gForm.school_year" list="dv-years" class="input" placeholder="114" />
            </div>
            <div>
              <label class="label">組號 <span class="text-red-700 dark:text-red-400">*</span></label>
              <input v-model="gForm.number" type="number" min="1" class="input" placeholder="1" />
            </div>
            <div class="col-span-2">
              <label class="label">專題名稱 <span class="text-red-700 dark:text-red-400">*</span></label>
              <input v-model="gForm.name" class="input" placeholder="專題主題 / 名稱" />
            </div>
            <div class="col-span-2">
              <label class="label">類別</label>
              <input v-model="gForm.category" class="input" placeholder="例如 遊戲、動畫" />
            </div>
          </div>
          <div>
            <label class="label">指導老師</label>
            <div class="flex flex-wrap gap-2 mt-1">
              <button
                type="button"
                v-for="t in data.teachers" :key="t.id"
                @click="toggleGroupTeacher(t.id)"
                class="px-2.5 py-1 rounded-full text-sm border transition-colors cursor-pointer"
                :class="gForm.teacher_ids.includes(t.id)
                  ? 'bg-blue-50 dark:bg-cyan-900/20 text-blue-700 dark:text-cyan-400 border-blue-200 dark:border-cyan-800/40'
                  : 'bg-slate-100 dark:bg-[#2a3347] text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-300 dark:hover:border-slate-600'"
              >
                {{ t.name }}
              </button>
              <span v-if="!data.teachers.length" class="text-xs text-slate-600 dark:text-slate-400">尚無老師，請先至「新增老師」建立。</span>
            </div>
          </div>
          <p v-if="gError" class="text-xs text-red-700 dark:text-red-400">{{ gError }}</p>
          <p v-if="gOk" class="text-xs text-emerald-800 dark:text-emerald-400 flex items-center gap-1"><Check class="w-3.5 h-3.5" />{{ gOk }}</p>
          <div class="flex">
            <button type="submit" class="btn-primary flex items-center gap-1.5" :disabled="gBusy">
              <FolderPlus class="w-4 h-4" /> {{ gBusy ? '新增中…' : '新增組別' }}
            </button>
          </div>
        </form>
        <p class="text-xs text-slate-600 mt-3 dark:text-slate-400">建立後可至「組別列表」檢視，組員與組長指定請至「組別異動」頁面操作。</p>
      </div>

      <!-- 批次匯入 -->
      <div v-show="tab === 'bulk'" class="card p-6 space-y-4">
        <div class="flex items-center gap-2 flex-wrap">
          <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onFile" />
          <button class="btn-secondary flex items-center gap-1.5" @click="fileInput?.click()">
            <FileSpreadsheet class="w-4 h-4" /> 選擇 Excel / CSV
          </button>
          <button class="text-xs text-blue-700 dark:text-cyan-400 hover:underline cursor-pointer" @click="downloadTemplate">
            下載範本
          </button>
          <span v-if="bulkFileName" class="text-xs text-slate-600 flex items-center gap-1 dark:text-slate-400">
            {{ bulkFileName }}
            <button @click="clearBulk" class="text-slate-600 hover:text-red-500 cursor-pointer dark:text-slate-400"><X class="w-3.5 h-3.5" /></button>
          </span>
        </div>

        <p class="text-xs text-slate-600 dark:text-slate-400">
          欄位：學號、姓名、班級、學年度。學號、姓名、學年度為必填（匯入一律為在學）。
        </p>

        <p v-if="bulkError" class="text-xs text-red-700 dark:text-red-400">{{ bulkError }}</p>

        <div v-if="bulkRows.length" class="border border-slate-200 dark:border-[#2a3347] rounded-lg overflow-hidden">
          <div class="max-h-96 overflow-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 dark:bg-[#161b27] sticky top-0">
                <tr class="text-xs text-slate-600 dark:text-slate-400">
                  <th class="text-left px-3 py-2">#</th>
                  <th class="text-left px-3 py-2">學號</th>
                  <th class="text-left px-3 py-2">姓名</th>
                  <th class="text-left px-3 py-2">班級</th>
                  <th class="text-left px-3 py-2">學年度</th>
                  <th class="text-left px-3 py-2">檢查</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-[#2a3347]">
                <tr v-for="(r, i) in bulkRows" :key="i" :class="r._error ? 'bg-red-50 dark:bg-red-900/10' : ''">
                  <td class="px-3 py-1.5 text-slate-600 text-xs dark:text-slate-400">{{ i + 1 }}</td>
                  <td class="px-3 py-1.5 id-mono">{{ r.student_id }}</td>
                  <td class="px-3 py-1.5">{{ r.name }}</td>
                  <td class="px-3 py-1.5 text-slate-600 dark:text-slate-400">{{ r.class_ }}</td>
                  <td class="px-3 py-1.5 text-slate-600 dark:text-slate-400">{{ r.school_year }}</td>
                  <td class="px-3 py-1.5 text-xs">
                    <span v-if="r._error" class="text-red-700 dark:text-red-400">{{ r._error }}</span>
                    <span v-else class="text-emerald-800 dark:text-emerald-400">OK</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="bulkRows.length" class="space-y-3">
          <p class="text-xs text-slate-600 dark:text-slate-400">
            可匯入 <span class="font-semibold text-emerald-800 dark:text-emerald-400">{{ validRows.length }}</span> 筆
            <span v-if="hasErrors" class="text-red-700 dark:text-red-400">・{{ bulkRows.length - validRows.length }} 筆有誤(將略過)</span>
          </p>
          <button class="btn-primary flex items-center gap-1.5" :disabled="!validRows.length || bulkBusy" @click="importBulk">
            <Upload class="w-4 h-4" /> {{ bulkBusy ? '匯入中…' : `匯入 ${validRows.length} 筆` }}
          </button>
        </div>

        <p v-if="bulkOk" class="text-xs text-emerald-800 dark:text-emerald-400 flex items-center gap-1"><Check class="w-3.5 h-3.5" />{{ bulkOk }}</p>
      </div>

      <!-- 新增老師 -->
      <div v-show="tab === 'teacher'" class="card p-6">
        <form @submit.prevent="submitTeacher" class="space-y-4">
          <div>
            <label class="label">老師姓名 <span class="text-red-700 dark:text-red-400">*</span></label>
            <input v-model="tName" class="input" placeholder="陳老師" />
          </div>
          <p v-if="tError" class="text-xs text-red-700 dark:text-red-400">{{ tError }}</p>
          <p v-if="tOk" class="text-xs text-emerald-800 dark:text-emerald-400 flex items-center gap-1"><Check class="w-3.5 h-3.5" />{{ tOk }}</p>
          <div class="flex">
            <button type="submit" class="btn-primary flex items-center gap-1.5" :disabled="tBusy">
              <GraduationCap class="w-4 h-4" /> {{ tBusy ? '新增中…' : '新增老師' }}
            </button>
          </div>
        </form>

        <div class="mt-5 pt-4 border-t border-slate-100 dark:border-[#2a3347]">
          <p class="text-xs text-slate-600 mb-2 dark:text-slate-400">目前老師（{{ data.teachers.length }}）</p>
          <div class="flex flex-wrap gap-2">
            <span v-for="t in data.teachers" :key="t.id"
                  class="px-2.5 py-1 rounded-full text-sm bg-slate-100 dark:bg-[#2a3347] text-slate-600 dark:text-slate-300">
              {{ t.name }}
            </span>
          </div>
        </div>
      </div>

      <!-- 全體升級（super_admin） -->
      <div v-if="auth.isAdmin" v-show="tab === 'promote'" class="card p-6 space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-100">全體升級一個年級</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            把每位學生班級裡的年級加一（例：112日三甲 → 112日四甲）。
            四年級改為畢業，只留學年與班別（例：111日四甲 → 111甲(畢業)）。
            學年度、分組與休退學狀態都不會變動。
          </p>
        </div>

        <ul class="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc pl-4">
          <li>共 {{ data.students.length }} 位學生，含休學／退學／抵免者一併升級。</li>
          <li>班級看不出年級（例如只填「甲」）或已標記畢業的，會自動跳過。</li>
          <li>此動作無法復原，執行前請先到總覽匯出一份 Excel 備份。</li>
        </ul>

        <p v-if="promoteError" class="text-xs text-red-700 dark:text-red-400">{{ promoteError }}</p>
        <p v-if="promoteMessage" class="text-xs text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
          <Check class="w-3.5 h-3.5" />{{ promoteMessage }}
        </p>

        <div class="flex">
          <button type="button" class="btn-danger flex items-center gap-1.5" :disabled="promoteBusy" @click="promoteAll">
            <ArrowUpNarrowWide class="w-4 h-4" /> {{ promoteBusy ? '升級中…' : '執行全體升級' }}
          </button>
        </div>
      </div>

    </div>
  </AppLayout>
</template>
