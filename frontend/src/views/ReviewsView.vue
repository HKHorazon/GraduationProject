<script setup>
// 審查評分：super_admin 開審查場次並設定評分項目，各評審對每一組打分數。
// 系上老師不能評自己指導的組（後端也擋）；外審委員沒有帳號，成績由 admin 用 Excel 匯入。
import { ref, computed, watch, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import {
  ClipboardCheck, Plus, Settings2, Trash2, Save, Lock, LockOpen,
  Download, Upload, FileSpreadsheet, X,
} from 'lucide-vue-next'
import AppLayout from '@/components/layout/AppLayout.vue'
import GroupName from '@/components/common/GroupName.vue'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import { rocYear } from '@/lib/year'

const auth = useAuthStore()
const data = useDataStore()

const EXT = '外:'   // 外審委員的 reviewer 前綴（與後端一致）

// 附件四「學生專題製作之評量尺規」
const RUBRIC = [
  { name: '具有服務社會與團隊合作之能力', weight: 15 },
  { name: '具備國際視野與溝通協調之能力', weight: 10 },
  { name: '具備跨域整合與數位創作之能力', weight: 25 },
  { name: '具備動漫設計與遊戲開發之能力', weight: 20 },
  { name: '具備活動展演與直播行銷之能力', weight: 15 },
  { name: '具備創新思維與問題分析之能力', weight: 15 },
]
const TOTAL_ONLY = [{ name: '總分', weight: 100 }]

const reviewId = ref('')
const tab = ref('mine')          // mine | overview
const busy = ref(false)
const message = ref('')
const error = ref('')

onMounted(async () => {
  await data.loadAll()
})

const review = computed(() => data.reviews.find((r) => r.id === reviewId.value) ?? null)

// 預設選最後建立的審查
watch(() => data.reviews, (rs) => {
  if (!reviewId.value && rs.length) reviewId.value = rs[rs.length - 1].id
}, { immediate: true })

watch(reviewId, async (id) => {
  error.value = ''
  message.value = ''
  if (!id) return
  try {
    await data.loadScores(id)
  } catch (e) {
    error.value = e.message ?? '載入評分失敗'
  }
})

const groups = computed(() =>
  data.groups
    .filter((g) => g.school_year === review.value?.school_year)
    .sort((a, b) => a.number - b.number)
)

function teacherName(id) {
  return data.teachers.find((t) => t.id === id)?.name ?? id
}
function reviewerLabel(key) {
  return key.startsWith(EXT) ? `${key.slice(EXT.length)}（外審）` : teacherName(key)
}
function weightedTotal(values) {
  const cs = review.value?.criteria ?? []
  const w = cs.reduce((a, c) => a + c.weight, 0) || 1
  return Math.round((values.reduce((a, v, i) => a + (Number(v) || 0) * (cs[i]?.weight ?? 0), 0) / w) * 100) / 100
}

// ---------- 我的評分 ----------
const myReviewer = computed(() => auth.user?.teacher_id ?? '')
// 自己指導的組不出現在評分表
const myGroups = computed(() =>
  groups.value.filter((g) => !g.teacher_ids.includes(myReviewer.value))
)
const ownGroups = computed(() =>
  groups.value.filter((g) => g.teacher_ids.includes(myReviewer.value))
)

const drafts = ref({})  // group_id -> { scores: [], comment }

function resetDrafts() {
  const n = review.value?.criteria.length ?? 0
  const next = {}
  for (const g of groups.value) {
    const row = data.scores.find((s) => s.group_id === g.id && s.reviewer === myReviewer.value)
    next[g.id] = {
      scores: row ? [...row.scores] : Array(n).fill(''),
      comment: row?.comment ?? '',
    }
  }
  drafts.value = next
}
watch([() => data.scores, review, myReviewer], resetDrafts, { immediate: true })

function draftFilled(gid) {
  const d = drafts.value[gid]
  return !!d && d.scores.length > 0 && d.scores.every((v) => v !== '' && v !== null)
}

async function saveRow(g) {
  if (!draftFilled(g.id) || busy.value) return
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    await data.putScore(reviewId.value, {
      group_id: g.id,
      reviewer: myReviewer.value,
      scores: drafts.value[g.id].scores.map(Number),
      comment: drafts.value[g.id].comment || null,
    })
    message.value = `第${g.number}組 評分已儲存`
  } catch (e) {
    error.value = e.message ?? '儲存失敗'
  } finally {
    busy.value = false
  }
}

async function clearRow(g) {
  const row = data.scores.find((s) => s.group_id === g.id && s.reviewer === myReviewer.value)
  if (!row || !confirm(`確定清除第${g.number}組的評分？`)) return
  busy.value = true
  error.value = ''
  try {
    await data.deleteScore(reviewId.value, row.id)
    message.value = `第${g.number}組 評分已清除`
  } catch (e) {
    error.value = e.message ?? '刪除失敗'
  } finally {
    busy.value = false
  }
}

// ---------- 總覽 ----------
const reviewers = computed(() => {
  const keys = [...new Set(data.scores.map((s) => s.reviewer))]
  // 系上老師在前、外審委員在後
  return keys.sort((a, b) => (a.startsWith(EXT) - b.startsWith(EXT)) || a.localeCompare(b))
})
function cell(groupId, reviewer) {
  return data.scores.find((s) => s.group_id === groupId && s.reviewer === reviewer) ?? null
}
function groupAverage(groupId) {
  const rows = data.scores.filter((s) => s.group_id === groupId)
  if (!rows.length) return null
  return Math.round((rows.reduce((a, s) => a + s.total, 0) / rows.length) * 100) / 100
}

// ---------- Excel ----------
// 欄位：組別 | 題目 | 評審 | <各評分項目> | 加權總分 | 評語
function sheetHeader() {
  return ['組別', '題目', '評審', ...review.value.criteria.map((c) => c.name), '加權總分', '評語']
}

function exportScores() {
  const rows = [sheetHeader()]
  for (const g of groups.value) {
    for (const r of reviewers.value) {
      const s = cell(g.id, r)
      if (!s) continue
      rows.push([g.number, g.name, reviewerLabel(r), ...s.scores, s.total, s.comment ?? ''])
    }
  }
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), '評分')
  XLSX.writeFile(wb, `${review.value.name}_評分_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// 範本＝每位系上老師 × 他可以評的組別（自己指導的組不列），分數欄留白給老師填。
// 外審委員照樣手動加列、「評審」欄打姓名即可。
function exportTemplate() {
  const blanks = review.value.criteria.map(() => '')
  const rows = [sheetHeader()]
  for (const t of data.teachers) {
    for (const g of groups.value) {
      if (g.teacher_ids.includes(t.id)) continue
      rows.push([g.number, g.name, t.name, ...blanks, '', ''])
    }
  }
  if (rows.length === 1) {
    for (const g of groups.value) rows.push([g.number, g.name, '', ...blanks, '', ''])
  }
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), '評分')
  XLSX.writeFile(wb, `${review.value.name}_評分範本.xlsx`)
}

const fileInput = ref(null)

async function onImportFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, blankrows: false })
    const payload = parseSheet(aoa)
    if (!payload.length) throw new Error('沒有讀到任何有效的評分列')
    await data.importScores(reviewId.value, payload)
    message.value = `已匯入 ${payload.length} 筆評分`
  } catch (err) {
    error.value = err.message ?? '匯入失敗'
  } finally {
    busy.value = false
  }
}

function parseSheet(aoa) {
  const names = review.value.criteria.map((c) => c.name)
  const head = (aoa[0] ?? []).map((h) => String(h ?? '').trim())
  const col = (n) => head.indexOf(n)
  const iGroup = col('組別')
  const iReviewer = col('評審')
  const iComment = col('評語')
  const iScores = names.map(col)
  if (iGroup === -1 || iReviewer === -1 || iScores.some((i) => i === -1)) {
    throw new Error('欄位不符：請用「下載範本」的表頭（組別／評審／各評分項目）')
  }

  const byNumber = Object.fromEntries(groups.value.map((g) => [String(g.number), g.id]))
  const byTeacherName = Object.fromEntries(data.teachers.map((t) => [t.name.trim(), t.id]))
  const out = []
  for (const row of aoa.slice(1)) {
    const rawReviewer = String(row[iReviewer] ?? '').trim()
    const values = iScores.map((i) => row[i])
    if (!rawReviewer || values.every((v) => v === '' || v === undefined || v === null)) continue

    const gid = byNumber[String(row[iGroup] ?? '').trim()]
    if (!gid) throw new Error(`找不到組別「${row[iGroup]}」（${rocYear(review.value.school_year)} 學年）`)

    const scores = values.map((v) => {
      const n = Number(v)
      if (Number.isNaN(n) || n < 0 || n > 100) throw new Error(`第${row[iGroup]}組「${rawReviewer}」的分數不合法：${v}`)
      return n
    })
    // 名字對得上系上老師就是老師，否則視為外審委員（「（外審）」後綴會被去掉）
    const bare = rawReviewer.replace(/（外審）$/, '').replace(/\(外審\)$/, '').trim()
    const reviewer = byTeacherName[bare] ?? `${EXT}${bare}`
    out.push({
      group_id: gid,
      reviewer,
      scores,
      comment: String(row[iComment] ?? '').trim() || null,
    })
  }
  return out
}

// 總覽格子的小修正（super_admin 可代改任何評審的分數；整批仍走匯入）
const editCell = ref(null)   // { group, reviewer, scores, comment, id }

function openCell(g, r) {
  if (!auth.isSuperAdmin) return
  const s = cell(g.id, r)
  editCell.value = {
    group: g,
    reviewer: r,
    scores: s ? [...s.scores] : review.value.criteria.map(() => ''),
    comment: s?.comment ?? '',
    id: s?.id ?? null,
  }
}

async function saveCell() {
  const c = editCell.value
  if (!c || busy.value) return
  if (c.scores.some((v) => v === '' || v === null)) { error.value = '請填完所有評分項目'; return }
  busy.value = true
  error.value = ''
  try {
    await data.putScore(reviewId.value, {
      group_id: c.group.id,
      reviewer: c.reviewer,
      scores: c.scores.map(Number),
      comment: c.comment || null,
    })
    message.value = `第${c.group.number}組 ${reviewerLabel(c.reviewer)} 的評分已更新`
    editCell.value = null
  } catch (e) {
    error.value = e.message ?? '儲存失敗'
  } finally {
    busy.value = false
  }
}

async function deleteCell() {
  const c = editCell.value
  if (!c?.id || busy.value) return
  if (!confirm(`確定刪除第${c.group.number}組「${reviewerLabel(c.reviewer)}」的評分？`)) return
  busy.value = true
  error.value = ''
  try {
    await data.deleteScore(reviewId.value, c.id)
    message.value = '評分已刪除'
    editCell.value = null
  } catch (e) {
    error.value = e.message ?? '刪除失敗'
  } finally {
    busy.value = false
  }
}

// ---------- 審查場次設定（super_admin） ----------
const showForm = ref(false)
const editing = ref(null)   // null = 新增
const form = ref({ name: '', school_year: '', criteria: [], is_open: true })

const years = computed(() =>
  [...new Set(data.groups.map((g) => g.school_year))].sort().reverse()
)

function openCreate() {
  editing.value = null
  form.value = {
    name: '',
    school_year: years.value[0] ?? '',
    criteria: structuredClone(TOTAL_ONLY),
    is_open: true,
  }
  showForm.value = true
}
function openEdit() {
  if (!review.value) return
  editing.value = review.value
  form.value = {
    name: review.value.name,
    school_year: review.value.school_year,
    criteria: structuredClone(review.value.criteria),
    is_open: review.value.is_open,
  }
  showForm.value = true
}
function usePreset(preset) {
  form.value.criteria = structuredClone(preset === 'rubric' ? RUBRIC : TOTAL_ONLY)
}
function addCriterion() {
  form.value.criteria.push({ name: '', weight: 10 })
}
function removeCriterion(i) {
  if (form.value.criteria.length > 1) form.value.criteria.splice(i, 1)
}

async function submitForm() {
  if (busy.value) return
  const f = form.value
  if (!f.name.trim() || !f.school_year) { error.value = '請填寫名稱與學年'; return }
  if (f.criteria.some((c) => !c.name.trim() || !(c.weight > 0))) {
    error.value = '評分項目名稱不可空白、權重需大於 0'
    return
  }
  busy.value = true
  error.value = ''
  try {
    const payload = {
      name: f.name.trim(),
      school_year: f.school_year,
      criteria: f.criteria.map((c) => ({ name: c.name.trim(), weight: Number(c.weight) })),
      is_open: f.is_open,
    }
    if (editing.value) {
      await data.updateReview(editing.value.id, payload)
    } else {
      const created = await data.createReview(payload)
      reviewId.value = created.id
    }
    showForm.value = false
    message.value = '審查設定已儲存'
  } catch (e) {
    error.value = e.message ?? '儲存失敗'
  } finally {
    busy.value = false
  }
}

async function toggleOpen() {
  if (!review.value) return
  busy.value = true
  error.value = ''
  try {
    await data.updateReview(review.value.id, { is_open: !review.value.is_open })
  } catch (e) {
    error.value = e.message ?? '儲存失敗'
  } finally {
    busy.value = false
  }
}

async function removeReview() {
  if (!review.value) return
  if (!confirm(`確定刪除「${review.value.name}」？該審查的所有評分會一併刪除。`)) return
  busy.value = true
  error.value = ''
  try {
    await data.deleteReview(review.value.id)
    reviewId.value = data.reviews[data.reviews.length - 1]?.id ?? ''
  } catch (e) {
    error.value = e.message ?? '刪除失敗'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ClipboardCheck class="w-5 h-5 text-blue-600 dark:text-cyan-400" /> 審查評分
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            各評審對每一組打分數；不可評分自己指導的組別。系上老師與外審委員的成績都可由管理者從 Excel 匯入。
          </p>
        </div>
        <div v-if="auth.isSuperAdmin" class="flex items-center gap-2">
          <button type="button" class="btn-secondary text-xs flex items-center gap-1" @click="openCreate">
            <Plus class="w-3.5 h-3.5" /> 新增審查
          </button>
          <button
            v-if="review" type="button" class="btn-secondary text-xs flex items-center gap-1"
            @click="openEdit"
          >
            <Settings2 class="w-3.5 h-3.5" /> 設定
          </button>
          <button
            v-if="review" type="button" class="btn-secondary text-xs flex items-center gap-1"
            :disabled="busy" @click="toggleOpen"
          >
            <component :is="review.is_open ? Lock : LockOpen" class="w-3.5 h-3.5" />
            {{ review.is_open ? '關閉評分' : '開放評分' }}
          </button>
          <button
            v-if="review" type="button" class="btn-danger text-xs flex items-center gap-1"
            :disabled="busy" @click="removeReview"
          >
            <Trash2 class="w-3.5 h-3.5" /> 刪除
          </button>
        </div>
      </div>

      <!-- 場次選擇 + 狀態 -->
      <div class="flex items-center gap-2 flex-wrap">
        <select v-model="reviewId" class="input w-64 text-xs">
          <option value="" disabled>選擇審查場次</option>
          <option v-for="r in data.reviews" :key="r.id" :value="r.id">
            {{ rocYear(r.school_year) }} 學年 — {{ r.name }}
          </option>
        </select>
        <span
          v-if="review"
          class="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest border"
          :class="review.is_open
            ? 'border-cyan-500/40 bg-cyan-400/10 text-cyan-600 dark:text-cyan-400'
            : 'border-amber-500/40 bg-amber-400/10 text-amber-600 dark:text-amber-400'"
        >{{ review.is_open ? '開放評分中' : '已關閉' }}</span>
        <span v-if="message" class="text-xs text-emerald-600 dark:text-emerald-400">{{ message }}</span>
        <span v-if="error" class="text-xs text-red-500 dark:text-red-400">{{ error }}</span>
      </div>

      <div v-if="!review" class="card px-4 py-10 text-center text-slate-400 dark:text-slate-600 text-sm">
        尚未建立任何審查場次{{ auth.isSuperAdmin ? '——按右上角「新增審查」開始。' : '。' }}
      </div>

      <template v-else>
        <!-- Excel 工具列（成績主要靠匯入，所以常駐在兩個分頁上方） -->
        <div class="card px-3 py-2 flex items-center gap-2 flex-wrap">
          <span class="text-xs font-medium text-slate-600 dark:text-slate-300 mr-1">Excel</span>
          <button
            v-if="auth.isSuperAdmin" type="button"
            class="btn-secondary text-xs flex items-center gap-1" @click="exportTemplate"
          ><FileSpreadsheet class="w-3.5 h-3.5" /> 下載範本</button>
          <button
            v-if="auth.isSuperAdmin" type="button"
            class="btn-primary text-xs flex items-center gap-1" :disabled="busy" @click="fileInput?.click()"
          ><Upload class="w-3.5 h-3.5" /> 匯入成績</button>
          <input
            v-if="auth.isSuperAdmin" ref="fileInput" type="file" accept=".xlsx,.xls,.csv"
            class="hidden" @change="onImportFile"
          />
          <button type="button" class="btn-secondary text-xs flex items-center gap-1" @click="exportScores">
            <Download class="w-3.5 h-3.5" /> 匯出成績
          </button>
          <span v-if="auth.isSuperAdmin" class="text-xs text-slate-500">
            「評審」欄填系上老師姓名即對應該老師；名字不在老師名單中就視為外審委員。
            同一組同一位評審重複匯入會覆蓋原分數。
          </span>
        </div>

        <!-- Tabs -->
        <div class="flex items-center gap-1 border-b border-slate-200 dark:border-[#2a3347]">
          <button
            v-for="t in [{ k: 'mine', l: '我的評分' }, { k: 'overview', l: '總覽' }]"
            :key="t.k" type="button"
            class="px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer"
            :class="tab === t.k
              ? 'border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
            @click="tab = t.k"
          >{{ t.l }}</button>
        </div>

        <!-- ---------- 我的評分 ---------- -->
        <div v-if="tab === 'mine'" class="space-y-3">
          <p v-if="!auth.isEditor" class="text-xs text-slate-400 dark:text-slate-500">
            僅檢視模式 — 需編輯權限才能評分。
          </p>
          <p v-else-if="!myReviewer" class="text-xs text-amber-600 dark:text-amber-400">
            此帳號尚未綁定系上老師，無法評分。請管理者到「帳號管理」設定對應老師。
          </p>
          <template v-else>
            <p v-if="ownGroups.length" class="text-xs text-slate-500">
              以下 {{ ownGroups.length }} 組是您指導的組別，依評分辦法不列入評分：
              {{ ownGroups.map((g) => `第${g.number}組`).join('、') }}
            </p>
            <div class="card overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-200 dark:border-[#2a3347]">
                    <th class="text-left px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">組別</th>
                    <th
                      v-for="c in review.criteria" :key="c.name"
                      class="px-2 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 text-center w-24"
                      :title="c.name"
                    >
                      <div class="truncate max-w-[7rem] mx-auto">{{ c.name }}</div>
                      <div class="text-slate-400 normal-case">{{ c.weight }}%</div>
                    </th>
                    <th class="px-2 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 text-center w-20">加權總分</th>
                    <th class="px-2 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 text-left w-48">評語</th>
                    <th class="px-2 py-2 w-28"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-[#2a3347]">
                  <tr v-for="g in myGroups" :key="g.id">
                    <td class="px-3 py-2 align-middle">
                      <div class="text-slate-800 dark:text-slate-100">
                        <span class="id-mono mr-1">第{{ g.number }}組</span>
                        <GroupName :group="g" />
                      </div>
                      <div class="text-xs text-slate-500">
                        {{ g.teacher_ids.map(teacherName).join('、') || '—' }}
                      </div>
                    </td>
                    <td v-for="(c, i) in review.criteria" :key="c.name" class="px-2 py-2 text-center">
                      <input
                        v-model="drafts[g.id].scores[i]"
                        type="number" min="0" max="100" step="1"
                        class="input text-center px-1 py-1 text-sm"
                        :disabled="!review.is_open && !auth.isSuperAdmin"
                      />
                    </td>
                    <td class="px-2 py-2 text-center font-mono text-blue-600 dark:text-cyan-400">
                      {{ draftFilled(g.id) ? weightedTotal(drafts[g.id].scores) : '—' }}
                    </td>
                    <td class="px-2 py-2">
                      <input
                        v-model="drafts[g.id].comment" type="text" placeholder="（選填）"
                        class="input px-2 py-1 text-xs"
                        :disabled="!review.is_open && !auth.isSuperAdmin"
                      />
                    </td>
                    <td class="px-2 py-2">
                      <div class="flex items-center gap-1">
                        <button
                          type="button" class="btn-primary text-xs px-2 py-1 flex items-center gap-1 disabled:opacity-40"
                          :disabled="busy || !draftFilled(g.id) || (!review.is_open && !auth.isSuperAdmin)"
                          @click="saveRow(g)"
                        ><Save class="w-3.5 h-3.5" /> 儲存</button>
                        <button
                          v-if="cell(g.id, myReviewer)" type="button"
                          class="btn-secondary text-xs px-2 py-1" :disabled="busy" title="清除評分"
                          @click="clearRow(g)"
                        ><Trash2 class="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!myGroups.length">
                    <td :colspan="review.criteria.length + 4" class="px-4 py-10 text-center text-slate-400 dark:text-slate-600 text-sm">
                      此學年沒有可評分的組別
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>

        <!-- ---------- 總覽 ---------- -->
        <div v-else class="space-y-3">
          <p v-if="auth.isSuperAdmin && reviewers.length" class="text-xs text-slate-500">
            點任一格可直接修正該評審對該組的分數（小修正用；整批請用匯入）。
          </p>

          <div class="card overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200 dark:border-[#2a3347]">
                  <th class="text-left px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">組別</th>
                  <th
                    v-for="r in reviewers" :key="r"
                    class="px-2 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 text-center w-24"
                  >{{ reviewerLabel(r) }}</th>
                  <th class="px-2 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 text-center w-20">平均</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-[#2a3347]">
                <tr v-for="g in groups" :key="g.id">
                  <td class="px-3 py-2">
                    <span class="id-mono mr-1">第{{ g.number }}組</span>
                    <GroupName :group="g" />
                  </td>
                  <td
                    v-for="r in reviewers" :key="r"
                    class="px-2 py-2 text-center font-mono"
                    :class="[
                      cell(g.id, r) ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600',
                      auth.isSuperAdmin ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-[#2a3347]' : '',
                    ]"
                    :title="cell(g.id, r)?.comment || (auth.isSuperAdmin ? '點擊修正' : '')"
                    @click="openCell(g, r)"
                  >{{ cell(g.id, r)?.total ?? '—' }}</td>
                  <td class="px-2 py-2 text-center font-mono font-semibold text-blue-600 dark:text-cyan-400">
                    {{ groupAverage(g.id) ?? '—' }}
                  </td>
                </tr>
                <tr v-if="!reviewers.length">
                  <td colspan="2" class="px-4 py-10 text-center text-slate-400 dark:text-slate-600 text-sm">
                    尚無任何評分資料
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- ---------- 單格修正 modal ---------- -->
      <div
        v-if="editCell"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="editCell = null"
      >
        <div class="card w-full max-w-md p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm">
              第{{ editCell.group.number }}組 · {{ reviewerLabel(editCell.reviewer) }}
            </h3>
            <button type="button" class="text-slate-400 hover:text-slate-600 cursor-pointer" @click="editCell = null">
              <X class="w-4 h-4" />
            </button>
          </div>
          <div class="space-y-2">
            <div v-for="(c, i) in review.criteria" :key="c.name" class="flex items-center gap-2">
              <span class="text-xs text-slate-600 dark:text-slate-300 flex-1 truncate" :title="c.name">
                {{ c.name }} <span class="text-slate-400">{{ c.weight }}%</span>
              </span>
              <input
                v-model="editCell.scores[i]" type="number" min="0" max="100"
                class="input w-24 text-center py-1"
              />
            </div>
          </div>
          <div>
            <label class="label">評語</label>
            <input v-model="editCell.comment" type="text" class="input" placeholder="（選填）" />
          </div>
          <div class="flex items-center justify-end gap-2">
            <span v-if="error" class="text-xs text-red-500 dark:text-red-400 mr-auto">{{ error }}</span>
            <button
              v-if="editCell.id" type="button" class="btn-danger text-sm mr-auto"
              :disabled="busy" @click="deleteCell"
            >刪除</button>
            <button type="button" class="btn-secondary text-sm" @click="editCell = null">取消</button>
            <button type="button" class="btn-primary text-sm" :disabled="busy" @click="saveCell">儲存</button>
          </div>
        </div>
      </div>

      <!-- ---------- 審查設定 modal ---------- -->
      <div
        v-if="showForm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="showForm = false"
      >
        <div class="card w-full max-w-2xl max-h-[85vh] overflow-y-auto p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-800 dark:text-slate-100">
              {{ editing ? '編輯審查' : '新增審查' }}
            </h3>
            <button type="button" class="text-slate-400 hover:text-slate-600 cursor-pointer" @click="showForm = false">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label">審查名稱</label>
              <input v-model="form.name" type="text" class="input" placeholder="例如：第一次企劃審查" />
            </div>
            <div>
              <label class="label">學年</label>
              <select v-model="form.school_year" class="input">
                <option v-for="y in years" :key="y" :value="y">{{ rocYear(y) }} 學年</option>
              </select>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="label mb-0">評分項目</label>
              <div class="flex items-center gap-2">
                <button type="button" class="btn-secondary text-xs py-1" @click="usePreset('total')">單一總分</button>
                <button type="button" class="btn-secondary text-xs py-1" @click="usePreset('rubric')">六向度尺規</button>
                <button type="button" class="btn-secondary text-xs py-1 flex items-center gap-1" @click="addCriterion">
                  <Plus class="w-3 h-3" /> 新增項目
                </button>
              </div>
            </div>
            <div class="space-y-2">
              <div v-for="(c, i) in form.criteria" :key="i" class="flex items-center gap-2">
                <input v-model="c.name" type="text" class="input flex-1" placeholder="項目名稱" />
                <input v-model.number="c.weight" type="number" min="1" max="100" class="input w-20 text-center" />
                <span class="text-xs text-slate-500">%</span>
                <button
                  type="button" class="btn-secondary text-xs px-2 py-1"
                  :disabled="form.criteria.length <= 1" @click="removeCriterion(i)"
                ><Trash2 class="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              總分 = 各項目分數依權重加權平均。已有評分資料時不可增減項目數量。
            </p>
          </div>

          <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input v-model="form.is_open" type="checkbox" class="cursor-pointer" /> 開放評分
          </label>

          <div class="flex items-center justify-end gap-2 pt-2">
            <span v-if="error" class="text-xs text-red-500 dark:text-red-400 mr-auto">{{ error }}</span>
            <button type="button" class="btn-secondary text-sm" @click="showForm = false">取消</button>
            <button type="button" class="btn-primary text-sm" :disabled="busy" @click="submitForm">儲存</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
