<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { rocYear, classLetter } from '@/lib/year'
import { Printer, ShieldOff, FileSearch, ClipboardList, FileDown, PenLine, GripVertical, ListOrdered, Shuffle } from 'lucide-vue-next'
import StudentName from '@/components/common/StudentName.vue'

const data = useDataStore()
const auth = useAuthStore()
onMounted(() => data.loadAll())

// ── Doc sidebar ───────────────────────────────────────────────────
const activeDoc = ref('attendance')

const DOCS = [
  { key: 'attendance',  icon: ClipboardList, label: '出席表',      sub: '附件・列印' },
  { key: 'signin-cat',  icon: PenLine,       label: '簽到表・分類', sub: '依類型分組・Word' },
  { key: 'signin-free', icon: ListOrdered,   label: '簽到表・自訂', sub: '自由排序・Word' },
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

// ── 簽到表（書面審查）─────────────────────────────────────────────
const sheetYear = ref('')                       // 級（民國學年）
const reviewTitle = ref('第三次專題書面審查')     // 審查名稱
const reviewDatetime = ref('')                   // 日期時間
const reviewLocation = ref('')                   // 地點
const reviewAudience = ref('日間部全體三年級學生') // 參加對象（可自訂）
const classPrefix = ref('日三')                   // 班級前綴（資料只存到甲/乙，前綴由使用者填）

// export-only ordering — 兩個子頁各自一份，不寫回資料庫
const SIGNIN_DOCS = {
  'signin-cat':  { mode: 'category', tag: '依類型', hint: '拖類型標題可移動整個類型，拖組別可在同類型內調整順序' },
  'signin-free': { mode: 'custom',   tag: '自訂',   hint: '拖拉調整任意順序，僅套用於本次輸出' },
}
const signinDoc = computed(() => SIGNIN_DOCS[activeDoc.value] ?? null)
const signinTab = computed(() => signinDoc.value?.mode ?? 'category')
const categoryOrder = ref([])
const customOrder = ref([])
const activeOrder = computed(() =>
  signinTab.value === 'category' ? categoryOrder.value : customOrder.value
)

watch([sheetYear, () => data.groups], () => {
  const list = data.groups
    .filter((g) => g.school_year === sheetYear.value)
    .sort((a, b) => a.number - b.number)
  customOrder.value = list
  // 同類別的組別相鄰排列（類別依第一次出現的順序），類別內維持第X組順序
  const buckets = new Map()
  list.forEach((g) => {
    const key = g.category || ''
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(g)
  })
  categoryOrder.value = [...buckets.values()].flat()
}, { immediate: true })

// --- native HTML5 drag & drop, live reorder（同 組別排序 頁）---
const dragIndex = ref(-1)
function onDragStart(i) { dragIndex.value = i }
function onDragEnter(i) {
  const from = dragIndex.value
  if (from === -1 || from === i) return
  const listRef = signinTab.value === 'category' ? categoryOrder : customOrder
  // ponytail: 依類型分頁只允許同類型互換，類型區塊因此自動保持相鄰
  if (signinTab.value === 'category' &&
      (listRef.value[from].category || '') !== (listRef.value[i].category || '')) return
  const arr = [...listRef.value]
  const [moved] = arr.splice(from, 1)
  arr.splice(i, 0, moved)
  listRef.value = arr
  dragIndex.value = i
}
function onDragEnd() { dragIndex.value = -1 }

// --- 依類型分頁：整個類型區塊也能拖 ---
// 類別是連續區塊且 key 唯一，所以用 category 字串當識別即可。
function bucketRuns(list) {
  const runs = []
  list.forEach((g) => {
    const key = g.category || ''
    const last = runs[runs.length - 1]
    if (last && last.key === key) last.items.push(g)
    else runs.push({ key, items: [g] })
  })
  return runs
}
const dragCat = ref(null)
function onCatDragStart(key) { dragCat.value = key; dragIndex.value = -1 }
function onCatDragEnter(key) {
  if (dragCat.value === null || dragCat.value === key) return
  const runs = bucketRuns(categoryOrder.value)
  const from = runs.findIndex((r) => r.key === dragCat.value)
  const to = runs.findIndex((r) => r.key === key)
  if (from < 0 || to < 0) return
  const [moved] = runs.splice(from, 1)
  runs.splice(to, 0, moved)
  categoryOrder.value = runs.flatMap((r) => r.items)
}
function onCatDragEnd() { dragCat.value = null }

// --- 隨機排序 ---
function shuffled(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function randomize() {
  if (signinTab.value === 'custom') {
    customOrder.value = shuffled(customOrder.value)
    return
  }
  // 依類型：類型的先後順序隨機，每個類型內部的組別順序也隨機
  categoryOrder.value = shuffled(bucketRuns(categoryOrder.value))
    .flatMap((r) => shuffled(r.items))
}

function categoryCount(g) {
  return categoryOrder.value.filter((x) => (x.category || '') === (g.category || '')).length
}
function isCategoryHead(i) {
  return i === 0 || (activeOrder.value[i - 1].category || '') !== (activeOrder.value[i].category || '')
}

function teacherLabel(g) {
  return g.teacher_ids
    .map((id) => data.teachers.find((t) => t.id === id)?.name)
    .filter(Boolean)
    .join('、')
}
function leaderOf(g) {
  return data.students.find((s) => s.id === g.leader_id) ?? null
}

// 112級→第三屆、113級→第四屆…（無第一、二屆）
const CJK = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
function cjkNum(n) {
  if (n < 10) return CJK[n]
  if (n === 10) return '十'
  if (n < 20) return '十' + CJK[n - 10]
  const t = Math.floor(n / 10), o = n % 10
  return CJK[t] + '十' + (o ? CJK[o] : '')
}
function cohortLabel(year) {
  const roc = rocYear(year)
  const n = Number(roc) - 109
  return n >= 1 ? `第${cjkNum(n)}屆（${roc}級）` : `（${roc}級）`
}
const subtitle = computed(() =>
  `${cohortLabel(sheetYear.value)} ${reviewTitle.value || ''} 專題組別簽到表`.trim()
)

// leader first, others by student_id
function groupMembers(g) {
  const members = data.students.filter((s) => s.group_id === g.id)
  const l = members.find((s) => s.id === g.leader_id)
  const rest = members
    .filter((s) => s.id !== g.leader_id)
    .sort((a, b) => String(a.student_id).localeCompare(String(b.student_id)))
  return l ? [l, ...rest] : rest
}

const downloading = ref('')

// 班級資料有的存「甲」有的存「日二甲」，只取最後一個班別字，前綴一律由 classPrefix 帶。
function classCell(c) {
  return classPrefix.value + String(c ?? '').trim().replace(/班$/, '').slice(-1)
}

async function downloadSignin(list, tag) {
  if (!sheetYear.value || !list.length || downloading.value) return
  downloading.value = tag
  try {
    const { downloadReviewSigninDocx } = await import('@/lib/attendanceYearDoc')
    await downloadReviewSigninDocx({
      subtitle: subtitle.value,
      datetime: reviewDatetime.value,
      location: reviewLocation.value,
      audience: reviewAudience.value,
      fileBase: `${reviewTitle.value || '簽到表'}_${rocYear(sheetYear.value)}級_${tag}`,
      groups: list.map((g, i) => ({
        order: i + 1,
        category: g.category || '',
        name: g.name,
        members: groupMembers(g).map((s) => ({
          class_label: classCell(s.class_),
          student_id: s.student_id,
          name: s.name,
          isLeader: s.id === g.leader_id,
        })),
      })),
    })
  } finally {
    downloading.value = ''
  }
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

        <!-- toolbar (shared) — attendance-year keeps its config in its own panel -->
        <div v-if="!signinDoc" class="flex items-center gap-3 flex-wrap mb-4 print:hidden">
          <template>
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
          </template>
        </div>

        <!-- ─── 文件3：專題組別簽到表（書面審查・Word）────────── -->
        <div v-if="signinDoc" class="max-w-3xl space-y-5">

          <!-- config -->
          <div class="card p-4 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="label">級</label>
                <select v-model="sheetYear" class="input">
                  <option value="">— 選擇級 —</option>
                  <option v-for="y in years" :key="y" :value="y">{{ cohortLabel(y) }}</option>
                </select>
              </div>
              <div>
                <label class="label">審查名稱</label>
                <input v-model="reviewTitle" class="input" placeholder="第三次專題書面審查" />
              </div>
              <div>
                <label class="label">日期時間</label>
                <input v-model="reviewDatetime" class="input" placeholder="115年06月18日（星期四）13:00-17:00" />
              </div>
              <div>
                <label class="label">地點</label>
                <input v-model="reviewLocation" class="input" placeholder="MB106會議廳" />
              </div>
              <div>
                <label class="label">參加對象</label>
                <input v-model="reviewAudience" class="input" placeholder="日間部全體三年級學生" />
              </div>
              <div>
                <label class="label">班級前綴</label>
                <input v-model="classPrefix" class="input" placeholder="日三" />
                <p class="mt-1 text-[11px] text-slate-400">會接上學生的班別字，例如「日三」＋「甲」＝ 日三甲</p>
              </div>
            </div>
            <p v-if="sheetYear" class="text-center text-sm font-semibold text-slate-700 dark:text-slate-200 pt-1">
              {{ subtitle }}
            </p>
          </div>

          <!-- empty states -->
          <div v-if="!sheetYear"
               class="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#2a3347] flex items-center justify-center">
              <FileSearch class="w-6 h-6 text-slate-400" />
            </div>
            <p class="font-semibold text-slate-700 dark:text-slate-300">選擇級以產生簽到表</p>
          </div>
          <div v-else-if="!activeOrder.length"
               class="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#2a3347] flex items-center justify-center">
              <FileSearch class="w-6 h-6 text-slate-400" />
            </div>
            <p class="font-semibold text-slate-700 dark:text-slate-300">此級沒有任何組別</p>
          </div>

          <template v-else>
            <div class="card p-4 space-y-3">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <p class="text-xs text-slate-500 dark:text-slate-400 min-w-0 flex-1">
                  {{ signinDoc.hint }}
                </p>
                <div class="flex items-center gap-2">
                  <button @click="randomize" class="btn-secondary flex items-center gap-1.5">
                    <Shuffle class="w-4 h-4" /> 隨機排序
                  </button>
                  <button @click="downloadSignin(activeOrder, signinDoc.tag)"
                          :disabled="!!downloading"
                          class="btn-primary flex items-center gap-1.5 disabled:opacity-60">
                    <FileDown class="w-4 h-4" /> {{ downloading ? '產生中…' : '下載 Word' }}
                  </button>
                </div>
              </div>

              <!-- 拖拉排序清單 -->
              <ol class="space-y-1">
                <template v-for="(g, i) in activeOrder" :key="g.id">
                  <!-- 類型標題列：拖它可移動整個大類型 -->
                  <li
                    v-if="signinTab === 'category' && isCategoryHead(i)"
                    draggable="true"
                    class="flex items-center gap-2 px-2 py-1 !mt-3 first:!mt-0 rounded select-none
                           border-l-2 bg-slate-100 dark:bg-[#1a2131]
                           cursor-grab active:cursor-grabbing"
                    :class="dragCat === (g.category || '')
                      ? 'border-blue-500 dark:border-cyan-400 ring-2 ring-blue-400 dark:ring-cyan-400'
                      : 'border-blue-300 dark:border-cyan-700'"
                    @dragstart="onCatDragStart(g.category || '')"
                    @dragenter.prevent="onCatDragEnter(g.category || '')"
                    @dragover.prevent
                    @drop.prevent="onCatDragEnd"
                    @dragend="onCatDragEnd"
                  >
                    <GripVertical class="w-3.5 h-3.5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                    <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {{ g.category || '未分類' }}
                    </span>
                    <span class="text-[10px] font-mono text-slate-400">{{ categoryCount(g) }} 組</span>
                  </li>

                  <li
                    draggable="true"
                    class="flex items-center gap-2 text-sm px-2 py-1.5 rounded select-none
                           bg-slate-50 dark:bg-[#232b3d] cursor-grab active:cursor-grabbing"
                    :class="[
                      dragIndex === i ? 'ring-2 ring-blue-400 dark:ring-cyan-400 relative z-10' : '',
                      signinTab === 'category' ? 'ml-4' : '',
                    ]"
                    @dragstart="onDragStart(i)"
                    @dragenter.prevent="onDragEnter(i)"
                    @dragover.prevent
                    @drop.prevent="onDragEnd"
                    @dragend="onDragEnd"
                  >
                    <GripVertical class="w-3.5 h-3.5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                    <span class="id-mono w-6 flex-shrink-0 text-slate-400">{{ i + 1 }}</span>
                    <span v-if="signinTab !== 'category'"
                          class="w-20 flex-shrink-0 truncate text-slate-500 dark:text-slate-400"
                          :title="g.category || ''">{{ g.category || '—' }}</span>
                    <span class="flex-1 min-w-0 truncate text-slate-800 dark:text-slate-200"
                          :title="g.name">{{ g.name }}</span>
                    <span class="w-28 flex-shrink-0 truncate text-xs text-slate-500 dark:text-slate-400"
                          :title="teacherLabel(g) || '未指定指導老師'">{{ teacherLabel(g) || '—' }}</span>
                    <span class="w-20 flex-shrink-0 truncate text-xs text-amber-600 dark:text-amber-400">
                      <StudentName v-if="leaderOf(g)" :student="leaderOf(g)" />
                      <template v-else>—</template>
                    </span>
                    <span class="w-10 flex-shrink-0 text-right text-xs text-slate-400">
                      {{ groupMembers(g).length }} 人
                    </span>
                  </li>
                </template>
              </ol>
            </div>
          </template>
        </div>

        <!-- empty state -->
        <div v-else-if="!group"
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

      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
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
