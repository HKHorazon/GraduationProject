<script setup>
// 審查評分：super_admin 開審查場次、設定評分項目與評審名單，各評審對每一組打分數。
// 系上老師不能評自己指導的組（後端也擋）；外審委員沒有帳號，成績由 admin 用 Excel 匯入。
import { ref, computed, watch, onMounted } from 'vue'
import { EXT, buildSheet, parseSheet, downloadSheet, sheetToAoa } from '@/lib/reviewSheet'
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
const tab = ref('overview')      // overview | mine
const busy = ref(false)
const message = ref('')
const error = ref('')

onMounted(() => { data.loadAll() })

const review = computed(() => data.reviews.find((r) => r.id === reviewId.value) ?? null)

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

const r2 = (n) => Math.round(n * 100) / 100

function teacherName(id) {
  return data.teachers.find((t) => t.id === id)?.name ?? id
}
function reviewerLabel(key) {
  return key.startsWith(EXT) ? `${key.slice(EXT.length)}（外審）` : teacherName(key)
}
function advisorNames(g) {
  return g.teacher_ids.map(teacherName).join('、')
}
// 系上老師不可評自己指導的組
function isOwn(g, reviewerKey) {
  return !reviewerKey.startsWith(EXT) && g.teacher_ids.includes(reviewerKey)
}
function weightedTotal(values) {
  const cs = review.value?.criteria ?? []
  const w = cs.reduce((a, c) => a + c.weight, 0) || 1
  return r2(values.reduce((a, v, i) => a + (Number(v) || 0) * (cs[i]?.weight ?? 0), 0) / w)
}

// ---------- 評審名單 ----------
// 設定的名單 ∪ 實際已評分的人（匯入時後端會自動把名單外的評審補進來）
const roster = computed(() => {
  const keys = new Set([...(review.value?.reviewers ?? []), ...data.scores.map((s) => s.reviewer)])
  return [...keys].sort(
    (a, b) => (a.startsWith(EXT) - b.startsWith(EXT)) || a.localeCompare(b, 'zh-Hant')
  )
})
const internalReviewers = computed(() => roster.value.filter((r) => !r.startsWith(EXT)))
const externalReviewers = computed(() => roster.value.filter((r) => r.startsWith(EXT)))

function cell(groupId, reviewer) {
  return data.scores.find((s) => s.group_id === groupId && s.reviewer === reviewer) ?? null
}
// 沒評分的評審不列入平均（分母只算實際有分數的人）
function avgOf(groupId, keys) {
  const rows = data.scores.filter((s) => s.group_id === groupId && keys.includes(s.reviewer))
  if (!rows.length) return null
  return r2(rows.reduce((a, s) => a + s.total, 0) / rows.length)
}
function finalScore(groupId) {
  const i = avgOf(groupId, internalReviewers.value)
  const e = avgOf(groupId, externalReviewers.value)
  if (i === null) return e
  if (e === null) return i
  const iw = review.value.internal_weight
  const ew = review.value.external_weight
  if (!(iw + ew)) return r2((i + e) / 2)
  return r2((i * iw + e * ew) / (iw + ew))
}

// ---------- 我的評分 ----------
const myReviewer = computed(() => auth.user?.teacher_id ?? '')
const myGroups = computed(() => groups.value.filter((g) => !isOwn(g, myReviewer.value)))
const ownGroups = computed(() => groups.value.filter((g) => isOwn(g, myReviewer.value)))

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
  const row = cell(g.id, myReviewer.value)
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

// ---------- Excel（矩陣版型，與畫面總覽相同；實作在 lib/reviewSheet.js） ----------
const sheetCtx = computed(() => ({
  criteria: review.value?.criteria ?? [],
  reviewers: roster.value,
  labels: Object.fromEntries(roster.value.map((r) => [r, reviewerLabel(r)])),
  groups: groups.value.map((g) => ({
    id: g.id,
    number: g.number,
    advisors: advisorNames(g),
    own: roster.value.filter((r) => isOwn(g, r)),
  })),
  scoreOf: (gid, r) => cell(gid, r),
  avgOf: (gid) => ({
    internal: avgOf(gid, internalReviewers.value),
    external: avgOf(gid, externalReviewers.value),
    final: finalScore(gid),
  }),
  groupByNumber: (num) => sheetCtx.value.groups.find((g) => String(g.number) === num) ?? null,
  teacherIdByName: (name) => data.teachers.find((t) => t.name.trim() === name)?.id ?? null,
}))

function exportScores() {
  downloadSheet(buildSheet(sheetCtx.value, { withScores: true }),
                `${review.value.name}_評分_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
function exportTemplate() {
  downloadSheet(buildSheet(sheetCtx.value, { withScores: false }),
                `${review.value.name}_評分範本.xlsx`)
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
    const payload = parseSheet(sheetCtx.value, sheetToAoa(await file.arrayBuffer()))
    if (!payload.length) throw new Error('沒有讀到任何有效的評分')
    await data.importScores(reviewId.value, payload)
    message.value = `已匯入 ${payload.length} 筆評分`
  } catch (err) {
    error.value = err.message ?? '匯入失敗'
  } finally {
    busy.value = false
  }
}

// ---------- 總覽單格小修正（super_admin） ----------
const editCell = ref(null)

function openCell(g, r) {
  if (!auth.isSuperAdmin || isOwn(g, r)) return
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

// ---------- 審查場次設定（super_admin，直接開在頁面上，不用彈窗） ----------
const formOpen = ref(false)
const editing = ref(null)   // null = 新增
const form = ref(null)
const extInput = ref('')

const years = computed(() =>
  [...new Set(data.groups.map((g) => g.school_year))].sort().reverse()
)

function openCreate() {
  editing.value = null
  form.value = {
    name: '',
    school_year: years.value[0] ?? '',
    criteria: structuredClone(TOTAL_ONLY),
    reviewers: data.teachers.map((t) => t.id),   // 預設全體系上老師
    internal_weight: 60,
    external_weight: 40,
    is_open: true,
  }
  extInput.value = ''
  error.value = ''
  formOpen.value = true
}
function openEdit() {
  if (!review.value) return
  editing.value = review.value
  form.value = {
    name: review.value.name,
    school_year: review.value.school_year,
    criteria: structuredClone(review.value.criteria),
    reviewers: [...roster.value],
    internal_weight: review.value.internal_weight,
    external_weight: review.value.external_weight,
    is_open: review.value.is_open,
  }
  extInput.value = ''
  error.value = ''
  formOpen.value = true
}
function usePreset(preset) {
  form.value.criteria = structuredClone(preset === 'rubric' ? RUBRIC : TOTAL_ONLY)
}
function addCriterion() { form.value.criteria.push({ name: '', weight: 10 }) }
function removeCriterion(i) {
  if (form.value.criteria.length > 1) form.value.criteria.splice(i, 1)
}
function toggleTeacher(id) {
  const list = form.value.reviewers
  const i = list.indexOf(id)
  if (i === -1) list.push(id)
  else list.splice(i, 1)
}
function addExternal() {
  const name = extInput.value.trim()
  if (!name) return
  const key = EXT + name
  if (!form.value.reviewers.includes(key)) form.value.reviewers.push(key)
  extInput.value = ''
}
function removeExternal(key) {
  form.value.reviewers = form.value.reviewers.filter((r) => r !== key)
}
const formExternals = computed(() => form.value?.reviewers.filter((r) => r.startsWith(EXT)) ?? [])

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
      reviewers: f.reviewers,
      internal_weight: Number(f.internal_weight) || 0,
      external_weight: Number(f.external_weight) || 0,
      is_open: f.is_open,
    }
    if (editing.value) {
      await data.updateReview(editing.value.id, payload)
    } else {
      const created = await data.createReview(payload)
      reviewId.value = created.id
    }
    formOpen.value = false
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
        <div v-if="auth.isSuperAdmin && !formOpen" class="flex items-center gap-2">
          <button type="button" class="btn-secondary text-xs flex items-center gap-1" @click="openCreate">
            <Plus class="w-3.5 h-3.5" /> 新增審查
          </button>
          <button
            v-if="review" type="button" class="btn-secondary text-xs flex items-center gap-1"
            @click="openEdit"
          ><Settings2 class="w-3.5 h-3.5" /> 設定</button>
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
          ><Trash2 class="w-3.5 h-3.5" /> 刪除</button>
        </div>
      </div>

      <!-- ---------- 審查設定（直接展開在頁面上） ---------- -->
      <div v-if="formOpen && form" class="card p-5 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-slate-800 dark:text-slate-100">
            {{ editing ? `編輯審查 — ${editing.name}` : '新增審查' }}
          </h3>
          <button
            type="button" class="text-slate-400 hover:text-slate-600 cursor-pointer"
            @click="formOpen = false"
          ><X class="w-4 h-4" /></button>
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

        <!-- 評分項目 -->
        <div>
          <div class="flex items-center justify-between mb-1 flex-wrap gap-2">
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
            每位評審的總分＝各項目依權重加權平均。已有評分資料時不可增減項目數量。
          </p>
        </div>

        <!-- 評審名單 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label class="label">系上老師</label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="t in data.teachers" :key="t.id"
                class="flex items-center gap-1.5 px-2 py-1 rounded border text-sm cursor-pointer transition-colors"
                :class="form.reviewers.includes(t.id)
                  ? 'border-blue-400 dark:border-cyan-500/50 bg-blue-50 dark:bg-cyan-400/10 text-blue-700 dark:text-cyan-400'
                  : 'border-slate-200 dark:border-[#2a3347] text-slate-600 dark:text-slate-400'"
              >
                <input
                  type="checkbox" class="cursor-pointer"
                  :checked="form.reviewers.includes(t.id)" @change="toggleTeacher(t.id)"
                />
                {{ t.name }}
              </label>
              <span v-if="!data.teachers.length" class="text-xs text-slate-500">尚無老師資料</span>
            </div>
          </div>
          <div>
            <label class="label">外審委員</label>
            <div class="flex items-center gap-2">
              <input
                v-model="extInput" type="text" class="input flex-1"
                placeholder="輸入姓名後按 Enter" @keydown.enter.prevent="addExternal"
              />
              <button type="button" class="btn-secondary text-xs py-2" @click="addExternal">加入</button>
            </div>
            <div class="flex flex-wrap gap-2 mt-2">
              <span
                v-for="k in formExternals" :key="k"
                class="flex items-center gap-1 px-2 py-1 rounded border text-sm
                       border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20
                       text-amber-700 dark:text-amber-400"
              >
                {{ k.slice(EXT.length) }}
                <button type="button" class="cursor-pointer hover:text-red-500" @click="removeExternal(k)">
                  <X class="w-3 h-3" />
                </button>
              </span>
              <span v-if="!formExternals.length" class="text-xs text-slate-500">（沒有外審委員）</span>
            </div>
          </div>
        </div>

        <!-- 系上 / 外審 比重 -->
        <div>
          <label class="label">成績比重</label>
          <div class="flex items-center gap-3 flex-wrap">
            <div class="flex items-center gap-1.5">
              <span class="text-sm text-slate-600 dark:text-slate-300">系上老師平均</span>
              <input v-model.number="form.internal_weight" type="number" min="0" max="100" class="input w-20 text-center" />
              <span class="text-xs text-slate-500">%</span>
            </div>
            <span class="text-slate-400">＋</span>
            <div class="flex items-center gap-1.5">
              <span class="text-sm text-slate-600 dark:text-slate-300">外審委員平均</span>
              <input v-model.number="form.external_weight" type="number" min="0" max="100" class="input w-20 text-center" />
              <span class="text-xs text-slate-500">%</span>
            </div>
            <span
              class="text-xs"
              :class="Number(form.internal_weight) + Number(form.external_weight) === 100
                ? 'text-slate-500' : 'text-amber-600 dark:text-amber-400'"
            >合計 {{ Number(form.internal_weight) + Number(form.external_weight) }}%</span>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            只有一邊有成績時，加權總分就等於那一邊的平均。沒評分的評審不列入平均。
          </p>
        </div>

        <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input v-model="form.is_open" type="checkbox" class="cursor-pointer" /> 開放評分
        </label>

        <div class="flex items-center justify-end gap-2 pt-1">
          <span v-if="error" class="text-xs text-red-500 dark:text-red-400 mr-auto">{{ error }}</span>
          <button type="button" class="btn-secondary text-sm" @click="formOpen = false">取消</button>
          <button type="button" class="btn-primary text-sm" :disabled="busy" @click="submitForm">儲存</button>
        </div>
      </div>

      <template v-else>
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
          <span v-if="review" class="text-xs text-slate-500">
            系上 {{ review.internal_weight }}% ／ 外審 {{ review.external_weight }}%
          </span>
          <span v-if="message" class="text-xs text-emerald-600 dark:text-emerald-400">{{ message }}</span>
          <span v-if="error" class="text-xs text-red-500 dark:text-red-400">{{ error }}</span>
        </div>

        <div v-if="!review" class="card px-4 py-10 text-center text-slate-400 dark:text-slate-600 text-sm">
          尚未建立任何審查場次{{ auth.isSuperAdmin ? '——按右上角「新增審查」開始。' : '。' }}
        </div>

        <template v-else>
          <!-- Excel 工具列（成績主要靠匯入，常駐在兩個分頁上方） -->
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
              版型與下方總覽相同：第一列各評審、第一欄組別、第二欄指導老師。
              自己指導的組別是紅色格，匯入時會跳過。
            </span>
          </div>

          <!-- Tabs -->
          <div class="flex items-center gap-1 border-b border-slate-200 dark:border-[#2a3347]">
            <button
              v-for="t in [{ k: 'overview', l: '總覽' }, { k: 'mine', l: '我的評分' }]"
              :key="t.k" type="button"
              class="px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer"
              :class="tab === t.k
                ? 'border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
              @click="tab = t.k"
            >{{ t.l }}</button>
          </div>

          <!-- ---------- 總覽 ---------- -->
          <div v-if="tab === 'overview'" class="space-y-3">
            <p v-if="auth.isSuperAdmin && roster.length" class="text-xs text-slate-500">
              點任一格可直接修正該評審對該組的分數（小修正用；整批請用匯入）。紅色格是該老師自己指導的組，不可評分。
            </p>

            <div class="card overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-200 dark:border-[#2a3347]">
                    <th class="text-left px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">組別</th>
                    <th class="text-left px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">指導老師</th>
                    <th
                      v-for="r in roster" :key="r"
                      class="px-2 py-2 text-[10px] font-mono uppercase tracking-widest text-center w-24"
                      :class="r.startsWith(EXT) ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'"
                    >{{ reviewerLabel(r) }}</th>
                    <th class="px-2 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 text-center w-20">系上平均</th>
                    <th class="px-2 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 text-center w-20">外審平均</th>
                    <th class="px-2 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 text-center w-20">加權總分</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-[#2a3347]">
                  <tr v-for="g in groups" :key="g.id">
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span class="id-mono mr-1">第{{ g.number }}組</span>
                      <GroupName :group="g" />
                    </td>
                    <td class="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                      {{ advisorNames(g) || '—' }}
                    </td>
                    <td
                      v-for="r in roster" :key="r"
                      class="px-2 py-2 text-center font-mono"
                      :class="isOwn(g, r)
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : [cell(g.id, r) ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600',
                           auth.isSuperAdmin ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-[#2a3347]' : '']"
                      :title="isOwn(g, r) ? '自己指導的組別，不可評分'
                        : (cell(g.id, r)?.comment || (auth.isSuperAdmin ? '點擊修正' : ''))"
                      @click="openCell(g, r)"
                    >{{ isOwn(g, r) ? '—' : (cell(g.id, r)?.total ?? '') }}</td>
                    <td class="px-2 py-2 text-center font-mono text-slate-600 dark:text-slate-300">
                      {{ avgOf(g.id, internalReviewers) ?? '—' }}
                    </td>
                    <td class="px-2 py-2 text-center font-mono text-slate-600 dark:text-slate-300">
                      {{ avgOf(g.id, externalReviewers) ?? '—' }}
                    </td>
                    <td class="px-2 py-2 text-center font-mono font-semibold text-blue-600 dark:text-cyan-400">
                      {{ finalScore(g.id) ?? '—' }}
                    </td>
                  </tr>
                  <tr v-if="!roster.length">
                    <td colspan="5" class="px-4 py-10 text-center text-slate-400 dark:text-slate-600 text-sm">
                      尚未設定評審名單，也還沒有任何評分
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ---------- 我的評分 ---------- -->
          <div v-else class="space-y-3">
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
                        <div class="text-xs text-slate-500">{{ advisorNames(g) || '—' }}</div>
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
        </template>
      </template>

      <!-- ---------- 單格修正 ---------- -->
      <div
        v-if="editCell"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
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
    </div>
  </AppLayout>
</template>
