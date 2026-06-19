<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { rocYear, classLetter } from '@/lib/year'
import { FileText, Printer, ShieldOff, FileSearch, ClipboardList } from 'lucide-vue-next'

const data = useDataStore()
const auth = useAuthStore()
onMounted(() => data.loadAll())

// ── Doc sidebar ───────────────────────────────────────────────────
const activeDoc = ref('attendance') // 'attendance' | 'form1'

const DOCS = [
  { key: 'attendance', icon: ClipboardList, label: '出席表',  sub: '附件・列印' },
  { key: 'form1',      icon: FileText,      label: '同意書',  sub: '附件一・列印' },
]

// ── Group selection ───────────────────────────────────────────────
const filterYear = ref('')
const selectedGroupId = ref('')

const years = computed(() =>
  [...new Set(data.groups.map((g) => g.school_year).filter(Boolean))].sort().reverse()
)

const selectableGroups = computed(() => {
  let list = [...data.groups]
  if (filterYear.value) list = list.filter((g) => g.school_year === filterYear.value)
  return list.sort((a, b) =>
    a.school_year === b.school_year
      ? a.number - b.number
      : String(b.school_year).localeCompare(String(a.school_year))
  )
})

const group = computed(() =>
  data.groups.find((g) => g.id === selectedGroupId.value) ?? null
)

// ── Common group data ─────────────────────────────────────────────
const leader = computed(() =>
  group.value ? data.students.find((s) => s.id === group.value.leader_id) ?? null : null
)

// all members including leader, leader first
const allMembers = computed(() => {
  if (!group.value) return []
  const l = leader.value
  const rest = data.students.filter(
    (s) => s.group_id === group.value.id && s.id !== group.value.leader_id
  )
  return l ? [l, ...rest] : rest
})

// for 同意書: 4 blank member rows (excluding leader)
const memberRows = computed(() => {
  const rows = allMembers.value.filter((s) => s.id !== group.value?.leader_id)
  while (rows.length < 4) rows.push(null)
  return rows
})

const teacherNames = computed(() =>
  group.value
    ? group.value.teacher_ids
        .map((id) => data.teachers.find((t) => t.id === id)?.name)
        .filter(Boolean)
        .join('、')
    : ''
)

const classDisplay = computed(() => {
  const src = leader.value ?? allMembers.value[0]
  return src ? classLetter(src.class_) : ''
})

// ── Attendance sheet: 10 blank rows ──────────────────────────────
const ATTENDANCE_ROWS = 10

function print() {
  window.print()
}
</script>

<template>
  <AppLayout>
    <!-- no permission -->
    <div v-if="!auth.isEditor"
         class="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#2a3347] flex items-center justify-center">
        <ShieldOff class="w-6 h-6 text-slate-400" />
      </div>
      <p class="font-semibold text-slate-700 dark:text-slate-300">無編輯權限</p>
      <p class="text-sm text-slate-400">此頁面僅限編輯者使用</p>
    </div>

    <div v-else class="flex gap-5 h-full">

      <!-- ═══ LEFT: doc sidebar ═══ -->
      <div class="w-44 flex-shrink-0 flex flex-col gap-1.5 print:hidden">
        <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2">
          文件輸出
        </p>
        <button
          v-for="doc in DOCS"
          :key="doc.key"
          @click="activeDoc = doc.key"
          class="flex items-center gap-2.5 px-3 py-3 rounded-lg text-left transition-colors cursor-pointer w-full"
          :class="activeDoc === doc.key
            ? 'bg-blue-50 dark:bg-cyan-900/15 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-800/40'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2a3347]'"
        >
          <component :is="doc.icon" class="w-4 h-4 flex-shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium leading-tight">{{ doc.label }}</p>
            <p class="text-[11px] opacity-60 truncate mt-0.5">{{ doc.sub }}</p>
          </div>
        </button>
      </div>

      <!-- ═══ RIGHT: content ═══ -->
      <div class="flex-1 min-w-0 overflow-y-auto">

        <!-- toolbar (shared) -->
        <div class="flex items-center gap-3 flex-wrap mb-4 print:hidden">
          <select v-model="filterYear" class="input !w-32 !py-1.5">
            <option value="">全部學年</option>
            <option v-for="y in years" :key="y" :value="y">{{ rocYear(y) }} 學年</option>
          </select>

          <select v-model="selectedGroupId" class="input !w-72 !py-1.5">
            <option value="">— 選擇組別 —</option>
            <option v-for="g in selectableGroups" :key="g.id" :value="g.id">
              {{ rocYear(g.school_year) }} 學年・第 {{ g.number }} 組・{{ g.name }}
            </option>
          </select>

          <button v-if="group" @click="print" class="btn-primary flex items-center gap-1.5 ml-auto">
            <Printer class="w-4 h-4" /> 列印
          </button>
        </div>

        <!-- empty state -->
        <div v-if="!group"
             class="flex flex-col items-center justify-center h-64 gap-3 text-center">
          <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#2a3347] flex items-center justify-center">
            <FileSearch class="w-6 h-6 text-slate-400" />
          </div>
          <p class="font-semibold text-slate-700 dark:text-slate-300">選擇組別以產生文件</p>
          <p class="text-sm text-slate-400">選擇後將自動帶入組別資料，可直接列印</p>
        </div>

        <!-- ─── 文件1：出席表 ──────────────────────────────────── -->
        <div v-else-if="activeDoc === 'attendance'" id="print-area" class="max-w-4xl">
          <div class="bg-white text-black border border-slate-300 rounded-xl print:border-0 print:rounded-none overflow-hidden shadow-sm print:shadow-none">

            <!-- header -->
            <div class="text-center py-5 px-6 border-b border-slate-300">
              <h2 class="text-lg font-bold mb-1">
                多媒體遊戲發展與應用系　專題製作出席記錄表
              </h2>
              <!-- group meta -->
              <div class="flex justify-center gap-8 text-sm mt-3">
                <span>學年度：{{ rocYear(group.school_year) }}</span>
                <span>班別：{{ classDisplay || '＿＿' }} 班</span>
                <span>第 {{ group.number }} 組</span>
                <span>指導老師：{{ teacherNames || '＿＿＿＿' }}</span>
              </div>
              <div class="text-sm mt-1.5">
                專題題目：{{ group.name }}　　類別：{{ group.category ?? '' }}
              </div>
            </div>

            <!-- attendance table -->
            <table class="w-full text-sm paper-table">
              <thead>
                <tr>
                  <th class="a-th w-8">次</th>
                  <th class="a-th w-24">日期</th>
                  <th class="a-th w-24">起訖時間</th>
                  <th class="a-th">地點</th>
                  <th class="a-th">討論主題</th>
                  <th v-for="m in allMembers" :key="m.id" class="a-th w-20">
                    <div class="font-medium">{{ m.name }}</div>
                    <div class="text-[10px] font-normal text-slate-500">{{ m.student_id }}</div>
                  </th>
                  <th class="a-th w-20">老師確認</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="n in ATTENDANCE_ROWS" :key="n">
                  <td class="a-td text-center text-slate-400">{{ n }}</td>
                  <td class="a-td"></td>
                  <td class="a-td"></td>
                  <td class="a-td"></td>
                  <td class="a-td"></td>
                  <td v-for="m in allMembers" :key="m.id" class="a-td"></td>
                  <td class="a-td"></td>
                </tr>
              </tbody>
            </table>

            <!-- footer -->
            <div class="px-6 py-4 text-xs text-slate-400 border-t border-slate-300">
              組長簽名：＿＿＿＿＿＿　　指導老師簽名：＿＿＿＿＿＿　　日期：＿＿＿＿ 年 ＿＿ 月 ＿＿ 日
            </div>
          </div>
        </div>

        <!-- ─── 文件2：同意書 ──────────────────────────────────── -->
        <div v-else-if="activeDoc === 'form1'" id="print-area" class="max-w-2xl">
          <div class="bg-white text-black border border-slate-300 rounded-xl print:border-0 print:rounded-none overflow-hidden shadow-sm print:shadow-none">

            <!-- header -->
            <div class="text-center py-5 px-6">
              <p class="text-[10px] font-mono text-slate-500 mb-1">
                附件一　FM-20430-008　表單修訂日期：114.08.21　保存期限：三年
              </p>
              <h2 class="text-lg font-bold">
                多媒體遊戲發展與應用系實務專題指導老師同意書
              </h2>
            </div>

            <!-- form table -->
            <table class="w-full text-sm paper-table">
              <tbody>
                <tr>
                  <td class="p-label">班　　級</td>
                  <td class="p-body" colspan="3">
                    {{ rocYear(group.school_year) }} 年　{{ classDisplay || '＿＿' }} 班　第 {{ group.number }} 組
                  </td>
                </tr>
                <tr>
                  <td class="p-label">指導老師姓名</td>
                  <td class="p-body" colspan="3">{{ teacherNames || '＿＿＿＿＿＿' }}</td>
                </tr>
                <tr>
                  <td class="p-label">組　　長</td>
                  <td class="p-body w-40">學號：{{ leader?.student_id ?? '' }}</td>
                  <td class="p-body w-32">姓名：{{ leader?.name ?? '' }}</td>
                  <td class="p-body">聯絡電話：</td>
                </tr>
                <tr v-for="(m, i) in memberRows" :key="i">
                  <td class="p-label">{{ i === 0 ? '組　　員' : '' }}</td>
                  <td class="p-body">學號：{{ m?.student_id ?? '' }}</td>
                  <td class="p-body">姓名：{{ m?.name ?? '' }}</td>
                  <td class="p-body">聯絡電話：</td>
                </tr>
                <tr>
                  <td class="p-label">專題題目</td>
                  <td class="p-body" colspan="3">{{ group.name }}</td>
                </tr>
                <tr>
                  <td class="p-label">類　　別</td>
                  <td class="p-body" colspan="3">{{ group.category ?? '' }}</td>
                </tr>
                <tr>
                  <td class="p-label">備　　註</td>
                  <td class="p-body h-16 align-top" colspan="3"></td>
                </tr>
              </tbody>
            </table>

            <div class="px-6 py-8 flex items-end justify-between text-sm">
              <p>指導老師簽名：＿＿＿＿＿＿＿＿＿＿</p>
              <p>日期：＿＿＿＿＿＿＿＿＿＿</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
/* ── 同意書 ─── */
.paper-table { border-collapse: collapse; }
.p-label {
  @apply px-4 py-2.5 text-sm font-medium whitespace-nowrap align-middle text-center
         bg-slate-50 border border-slate-400 w-28;
}
.p-body {
  @apply px-4 py-2.5 align-middle border border-slate-400;
}

/* ── 出席表 ─── */
.a-th {
  @apply px-2 py-2 text-xs font-semibold text-center align-middle
         bg-slate-50 border border-slate-400;
}
.a-td {
  @apply px-2 py-0 h-9 border border-slate-300;
}
</style>

<style>
@media print {
  body * { visibility: hidden; }
  #print-area, #print-area * { visibility: visible; }
  #print-area {
    position: absolute;
    left: 0; top: 0;
    width: 100%;
    max-width: none;
  }
}
/* landscape for the attendance sheet (more columns) */
@media print {
  @page { size: A4 landscape; }
}
</style>
