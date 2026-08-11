<script setup>
// 審查評分：super_admin 開審查場次、設定評分項目與評審名單。
// 老師不用自己的帳號評分 —— 成績一律由管理者用 Excel 匯入，或直接在下方表格上改。
// 系上老師不可評自己指導的組（後端也擋），那些格子是紅色的。
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { EXT, buildWorkbook, parseWorkbook, downloadWorkbook } from '@/lib/reviewSheet'
import {
  ClipboardCheck, Plus, Settings2, Trash2, Lock, LockOpen,
  Download, Upload, FileSpreadsheet, X, ChevronUp, ChevronDown,
} from 'lucide-vue-next'
import AppLayout from '@/components/layout/AppLayout.vue'
import GroupName from '@/components/common/GroupName.vue'
import StudentName from '@/components/common/StudentName.vue'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import { rocYear } from '@/lib/year'

const auth = useAuthStore()
const data = useDataStore()

const TOTAL_ONLY = [{ name: '總分', weight: 100 }]

// 系上老師欄位的固定順序（系上習慣）。名單外的老師接在後面，外審委員永遠最後。
const TEACHER_ORDER = ['楊', '洪國', '黃', '劉', '林', '王']

const reviewId = ref('')
const busy = ref(false)
const message = ref('')
const error = ref('')
const sortKey = ref('number')        // number | internal | external | final
const sortAsc = ref(true)

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

const r2 = (n) => Math.round(n * 100) / 100
const canEdit = computed(() => auth.isSuperAdmin)

function teacherName(id) {
  return data.teachers.find((t) => t.id === id)?.name ?? id
}
function reviewerLabel(key) {
  return key.startsWith(EXT) ? `${key.slice(EXT.length)}（外審）` : teacherName(key)
}
// 表格欄頭用的簡短名稱：外審委員不加「（外審）」，欄頭已用黃字標示（hover 的 title 仍給全名）
function reviewerShort(key) {
  return key.startsWith(EXT) ? key.slice(EXT.length) : teacherName(key)
}
function advisorNames(g) {
  return g.teacher_ids.map(teacherName).join('、')
}
function leaderOf(g) {
  return data.students.find((s) => s.id === g.leader_id) ?? null
}
function isOwn(g, reviewerKey) {
  return !reviewerKey.startsWith(EXT) && g.teacher_ids.includes(reviewerKey)
}

// ---------- 評審名單 ----------
// 設定的名單 ∪ 實際已評分的人（匯入時後端會把名單外的評審自動補進來）
function reviewerRank(key) {
  if (key.startsWith(EXT)) return 999
  const name = teacherName(key)
  const i = TEACHER_ORDER.findIndex((p) => name.startsWith(p))
  return i === -1 ? 500 : i
}
const roster = computed(() => {
  const keys = new Set([...(review.value?.reviewers ?? []), ...data.scores.map((s) => s.reviewer)])
  return [...keys].sort(
    (a, b) => reviewerRank(a) - reviewerRank(b)
      || reviewerLabel(a).localeCompare(reviewerLabel(b), 'zh-Hant')
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

// ---------- 組別（含排序） ----------
const yearGroups = computed(() =>
  data.groups.filter((g) => g.school_year === review.value?.school_year)
)
const groups = computed(() => {
  const dir = sortAsc.value ? 1 : -1
  const value = (g) => {
    if (sortKey.value === 'internal') return avgOf(g.id, internalReviewers.value)
    if (sortKey.value === 'external') return avgOf(g.id, externalReviewers.value)
    if (sortKey.value === 'final') return finalScore(g.id)
    return g.number
  }
  return [...yearGroups.value].sort((a, b) => {
    const va = value(a)
    const vb = value(b)
    if (va === null && vb === null) return a.number - b.number
    if (va === null) return 1          // 沒成績的排最後，不受升降冪影響
    if (vb === null) return -1
    return (va - vb) * dir || a.number - b.number
  })
})
function sortBy(key) {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value
  else { sortKey.value = key; sortAsc.value = key === 'number' }
}

// ---------- 點格子開懸浮視窗改分數 ----------
// 各評分項目分開填；總分＝依權重加權平均（也可以直接改總分，會把每一項填成同一個值）。
const edit = ref(null)   // { g, r, scores: [], comment }

const isEmpty = (v) => v === '' || v === null || v === undefined

function openCell(g, r) {
  if (!canEdit.value || isOwn(g, r)) return
  const row = cell(g.id, r)
  const n = review.value?.criteria.length ?? 1
  edit.value = {
    g,
    r,
    scores: row ? row.scores.map((s) => s) : Array(n).fill(''),
    comment: row?.comment ?? '',
  }
  error.value = ''
  nextTick(() => document.getElementById('cell-score-0')?.focus())
}

const editBlank = computed(() => (edit.value?.scores ?? []).every(isEmpty))
const editTotal = computed({
  get() {
    if (!edit.value || editBlank.value) return ''
    const cs = review.value.criteria
    const w = cs.reduce((a, c) => a + c.weight, 0) || 1
    return r2(edit.value.scores.reduce((a, s, i) => a + (Number(s) || 0) * cs[i].weight, 0) / w)
  },
  set(v) {
    edit.value.scores = edit.value.scores.map(() => v)
  },
})

async function saveCell() {
  if (busy.value || !edit.value) return
  const { g, r, scores, comment } = edit.value
  const row = cell(g.id, r)
  if (editBlank.value && !row) { edit.value = null; return }
  if (!editBlank.value && scores.some((s) => isEmpty(s) || Number(s) < 0 || Number(s) > 100)) {
    error.value = '每一項分數都要填，且介於 0 到 100'
    return
  }

  busy.value = true
  error.value = ''
  try {
    if (editBlank.value) {
      await data.deleteScore(reviewId.value, row.id)
      message.value = `第${g.number}組 ${reviewerLabel(r)} 的評分已清除`
    } else {
      await data.putScore(reviewId.value, {
        group_id: g.id,
        reviewer: r,
        scores: scores.map(Number),
        comment: comment || null,
      })
      message.value = `第${g.number}組 ${reviewerLabel(r)} 已儲存`
    }
    edit.value = null
  } catch (e) {
    error.value = e.message ?? '儲存失敗'
  } finally {
    busy.value = false
  }
}

function clearCell() {
  edit.value.scores = edit.value.scores.map(() => '')
  edit.value.comment = ''
}

// 表格上只顯示總分，細節放進 tooltip
function cellTitle(g, r) {
  const s = cell(g.id, r)
  if (!s) return canEdit.value ? '點擊輸入評分' : '尚未評分'
  const items = review.value.criteria.map((c, i) => `${c.name} ${s.scores[i]}`).join('、')
  return [items, s.comment].filter(Boolean).join('\n')
}

const criteriaSummary = computed(() =>
  (review.value?.criteria ?? []).map((c) => `${c.name} ${c.weight}%`).join('、')
)

// ---------- Excel（一位評審一張工作表；實作在 lib/reviewSheet.js） ----------
const sheetCtx = computed(() => ({
  criteria: review.value?.criteria ?? [],
  reviewers: roster.value,
  labels: Object.fromEntries(roster.value.map((r) => [r, reviewerLabel(r)])),
  groups: groups.value.map((g) => ({
    id: g.id,
    number: g.number,
    name: g.name,
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
  downloadWorkbook(buildWorkbook(sheetCtx.value, { withScores: true }),
                   `${review.value.name}_評分_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
function exportTemplate() {
  downloadWorkbook(buildWorkbook(sheetCtx.value, { withScores: false }),
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
    const payload = parseWorkbook(sheetCtx.value, await file.arrayBuffer())
    if (!payload.length) throw new Error('沒有讀到任何有效的評分')
    await data.importScores(reviewId.value, payload)
    message.value = `已匯入 ${payload.length} 筆評分`
  } catch (err) {
    error.value = err.message ?? '匯入失敗'
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
function useTotalOnly() { form.value.criteria = structuredClone(TOTAL_ONLY) }
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
            <ClipboardCheck class="w-5 h-5 text-blue-700 dark:text-cyan-400" /> 審查評分
          </h2>
          <p class="text-xs text-slate-600 mt-0.5 dark:text-slate-400">
            成績由管理者以 Excel 匯入，也可以直接在表格上輸入總分。系上老師不可評分自己指導的組別（紅色格）。
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
            type="button" class="text-slate-600 hover:text-slate-600 cursor-pointer dark:text-slate-400"
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
              <button type="button" class="btn-secondary text-xs py-1" @click="useTotalOnly">單一總分</button>
              <button type="button" class="btn-secondary text-xs py-1 flex items-center gap-1" @click="addCriterion">
                <Plus class="w-3 h-3" /> 新增項目
              </button>
            </div>
          </div>
          <div class="space-y-2">
            <div v-for="(c, i) in form.criteria" :key="i" class="flex items-center gap-2">
              <input v-model="c.name" type="text" class="input flex-1" placeholder="項目名稱" />
              <input v-model.number="c.weight" type="number" min="1" max="100" class="input w-20 text-center" />
              <span class="text-xs text-slate-600 dark:text-slate-400">%</span>
              <button
                type="button" class="btn-secondary text-xs px-2 py-1"
                :disabled="form.criteria.length <= 1" @click="removeCriterion(i)"
              ><Trash2 class="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <p class="text-xs text-slate-600 mt-1 dark:text-slate-400">
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
              <span v-if="!data.teachers.length" class="text-xs text-slate-600 dark:text-slate-400">尚無老師資料</span>
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
                       text-amber-800 dark:text-amber-400"
              >
                {{ k.slice(EXT.length) }}
                <button type="button" class="cursor-pointer hover:text-red-500" @click="removeExternal(k)">
                  <X class="w-3 h-3" />
                </button>
              </span>
              <span v-if="!formExternals.length" class="text-xs text-slate-600 dark:text-slate-400">（沒有外審委員）</span>
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
              <span class="text-xs text-slate-600 dark:text-slate-400">%</span>
            </div>
            <span class="text-slate-600 dark:text-slate-400">＋</span>
            <div class="flex items-center gap-1.5">
              <span class="text-sm text-slate-600 dark:text-slate-300">外審委員平均</span>
              <input v-model.number="form.external_weight" type="number" min="0" max="100" class="input w-20 text-center" />
              <span class="text-xs text-slate-600 dark:text-slate-400">%</span>
            </div>
            <span
              class="text-xs"
              :class="Number(form.internal_weight) + Number(form.external_weight) === 100
                ? 'text-slate-600 dark:text-slate-400' : 'text-amber-800 dark:text-amber-400'"
            >合計 {{ Number(form.internal_weight) + Number(form.external_weight) }}%</span>
          </div>
          <p class="text-xs text-slate-600 mt-1 dark:text-slate-400">
            只有一邊有成績時，加權總分就等於那一邊的平均。沒評分的評審不列入平均。
          </p>
        </div>

        <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input v-model="form.is_open" type="checkbox" class="cursor-pointer" /> 開放評分
        </label>

        <div class="flex items-center justify-end gap-2 pt-1">
          <span v-if="error" class="text-xs text-red-700 dark:text-red-400 mr-auto">{{ error }}</span>
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
            class="text-sm font-medium text-cyan-800 dark:text-cyan-400"
            :title="`評分標準：${criteriaSummary}`"
          >評分標準：{{ criteriaSummary }}</span>
          <span v-if="review" class="text-sm font-medium text-cyan-800 dark:text-cyan-400">
            ｜ 系上 {{ review.internal_weight }}% ／ 外審 {{ review.external_weight }}%
          </span>
          <span v-if="message" class="text-xs text-emerald-800 dark:text-emerald-400">{{ message }}</span>
          <span v-if="error" class="text-xs text-red-700 dark:text-red-400">{{ error }}</span>
        </div>

        <div v-if="!review" class="card px-4 py-10 text-center text-slate-600 dark:text-slate-400 text-sm">
          尚未建立任何審查場次{{ auth.isSuperAdmin ? '——按右上角「新增審查」開始。' : '。' }}
        </div>

        <template v-else>
          <!-- Excel 工具列 -->
          <div class="card px-3 py-2 flex items-center gap-2 flex-wrap">
            <span class="text-xs font-medium text-slate-600 dark:text-slate-300 mr-1">Excel</span>
            <button
              v-if="canEdit" type="button"
              class="btn-primary text-xs flex items-center gap-1" @click="exportTemplate"
            ><FileSpreadsheet class="w-3.5 h-3.5" /> 下載範本</button>
            <button
              v-if="canEdit" type="button"
              class="btn-primary text-xs flex items-center gap-1" :disabled="busy" @click="fileInput?.click()"
            ><Upload class="w-3.5 h-3.5" /> 匯入成績</button>
            <input
              v-if="canEdit" ref="fileInput" type="file" accept=".xlsx,.xls,.csv"
              class="hidden" @change="onImportFile"
            />
            <button type="button" class="btn-primary text-xs flex items-center gap-1" @click="exportScores">
              <Download class="w-3.5 h-3.5" /> 匯出成績
            </button>
            <span v-if="canEdit" class="text-xs text-slate-600 dark:text-slate-400">
              Excel 一位評審一張工作表（自己指導的組別不會列出）。直接在格子輸入總分、離開欄位即存檔；清空該格＝刪除該筆。
            </span>
          </div>

          <!-- ---------- 評分表 ---------- -->
          <div class="card overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200 dark:border-[#2a3347]">
                  <th
                    class="text-left px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-600
                           whitespace-nowrap cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-300 dark:text-slate-400"
                    title="依組號排序"
                    @click="sortBy('number')"
                  >
                    組別
                    <component
                      :is="sortAsc ? ChevronUp : ChevronDown" v-if="sortKey === 'number'"
                      class="w-3 h-3 inline-block align-middle"
                    />
                  </th>
                  <th class="text-left px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-600 whitespace-nowrap dark:text-slate-400">題目</th>
                  <th class="text-left px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-600 whitespace-nowrap dark:text-slate-400">組長</th>
                  <th class="text-left px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-600 whitespace-nowrap dark:text-slate-400">指導老師</th>
                  <th
                    v-for="r in roster" :key="r"
                    class="px-1 py-2 text-xs font-medium text-center border-l border-slate-200 dark:border-[#2a3347]"
                    :class="r.startsWith(EXT) ? 'text-amber-800 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'"
                    :title="reviewerLabel(r)"
                  ><span class="block max-w-[4.5rem] truncate mx-auto">{{ reviewerShort(r) }}</span></th>
                  <th
                    v-for="c in [
                      { key: 'internal', label: '系上平均', title: '系上老師平均' },
                      { key: 'external', label: '外審平均', title: '外審委員平均' },
                      { key: 'final', label: '加權總分', title: '加權總分（系上 × 系上% ＋ 外審 × 外審%）' },
                    ]" :key="c.key"
                    class="w-24 px-4 py-2 text-xs font-semibold text-slate-700 text-center
                           whitespace-nowrap cursor-pointer select-none hover:text-blue-700 dark:hover:text-cyan-400
                           border-l border-slate-200 dark:border-[#2a3347] dark:text-slate-200"
                    :title="`${c.title}（點擊排序）`"
                    @click="sortBy(c.key)"
                  >
                    {{ c.label }}
                    <component
                      :is="sortAsc ? ChevronUp : ChevronDown" v-if="sortKey === c.key"
                      class="w-3 h-3 inline-block align-middle"
                    />
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-[#2a3347]">
                <tr v-for="g in groups" :key="g.id">
                  <td class="px-3 py-1.5 whitespace-nowrap">
                    <span class="id-mono">第{{ g.number }}組</span>
                  </td>
                  <td class="px-3 py-1.5 whitespace-nowrap" :title="g.name">
                    <span class="inline-block max-w-[16rem] truncate align-bottom">
                      <GroupName :group="g" />
                    </span>
                  </td>
                  <td class="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    <StudentName v-if="leaderOf(g)" :student="leaderOf(g)" />
                    <span v-else>—</span>
                  </td>
                  <td
                    class="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap"
                    :title="advisorNames(g)"
                  >{{ advisorNames(g) || '—' }}</td>

                  <!-- 每位評審一欄，只顯示總分；點下去開懸浮視窗改各項分數與評語 -->
                  <td
                    v-for="r in roster" :key="r"
                    class="px-1 py-1.5 text-center border-l border-slate-200 dark:border-[#2a3347]"
                    :class="isOwn(g, r)
                      ? 'bg-red-300 dark:bg-red-900/30'
                      : (canEdit ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-[#2a3347]' : '')"
                    :title="isOwn(g, r) ? '自己指導的組別，不可評分' : cellTitle(g, r)"
                    @click="openCell(g, r)"
                  >
                    <span
                      v-if="isOwn(g, r)"
                      class="font-mono font-semibold text-red-800 dark:text-red-400"
                    >—</span>
                    <span v-else class="font-mono text-slate-700 dark:text-slate-200">
                      {{ cell(g.id, r)?.total ?? '—' }}
                    </span>
                  </td>

                  <td class="px-4 py-1.5 text-center font-mono text-slate-600 dark:text-slate-300
                             border-l border-slate-200 dark:border-[#2a3347]">
                    {{ avgOf(g.id, internalReviewers) ?? '—' }}
                  </td>
                  <td class="px-4 py-1.5 text-center font-mono text-slate-600 dark:text-slate-300
                             border-l border-slate-200 dark:border-[#2a3347]">
                    {{ avgOf(g.id, externalReviewers) ?? '—' }}
                  </td>
                  <td class="px-4 py-1.5 text-center font-mono font-semibold text-blue-700 dark:text-cyan-400
                             border-l border-slate-200 dark:border-[#2a3347]">
                    {{ finalScore(g.id) ?? '—' }}
                  </td>
                </tr>
                <tr v-if="!roster.length">
                  <td colspan="7" class="px-4 py-10 text-center text-slate-600 dark:text-slate-400 text-sm">
                    尚未設定評審名單，也還沒有任何評分{{ auth.isSuperAdmin ? '——按「設定」加入評審。' : '。' }}
                  </td>
                </tr>
                <tr v-else-if="!groups.length">
                  <td :colspan="7 + roster.length"
                      class="px-4 py-10 text-center text-slate-600 dark:text-slate-400 text-sm">
                    此學年沒有組別
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </template>
    </div>

    <!-- ---------- 單格評分彈窗 ---------- -->
    <div
      v-if="edit" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="edit = null"
    >
      <div class="card w-full max-w-md p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-100">
            第{{ edit.g.number }}組 — {{ reviewerLabel(edit.r) }}
          </h3>
          <button
            type="button" class="text-slate-600 hover:text-slate-700 cursor-pointer dark:text-slate-400 dark:hover:text-slate-300"
            title="關閉" @click="edit = null"
          ><X class="w-4 h-4" /></button>
        </div>
        <p class="text-xs text-slate-600 dark:text-slate-400 truncate" :title="edit.g.name">{{ edit.g.name }}</p>

        <!-- 各評分項目（只有單一總分時就不重複顯示） -->
        <div v-if="review.criteria.length > 1" class="space-y-2">
          <div v-for="(c, i) in review.criteria" :key="i" class="flex items-center gap-2">
            <label :for="`cell-score-${i}`" class="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">
              {{ c.name }}
              <span class="text-xs text-slate-600 dark:text-slate-400">{{ c.weight }}%</span>
            </label>
            <input
              :id="`cell-score-${i}`" v-model="edit.scores[i]"
              type="number" min="0" max="100" class="input w-24 text-center text-sm"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <label for="cell-total" class="text-sm font-semibold text-slate-800 dark:text-slate-100 flex-1">
            總分
            <span v-if="review.criteria.length > 1" class="text-xs font-normal text-slate-600 dark:text-slate-400">
              （加權平均；直接改會把每一項填成同一個值）
            </span>
          </label>
          <input
            :id="review.criteria.length > 1 ? 'cell-total' : 'cell-score-0'" v-model="editTotal"
            type="number" min="0" max="100" class="input w-24 text-center text-sm font-mono"
          />
        </div>

        <div>
          <label for="cell-comment" class="label">評語</label>
          <textarea
            id="cell-comment" v-model="edit.comment" rows="3"
            class="input text-sm" placeholder="（可留空）"
          ></textarea>
        </div>

        <p class="text-xs text-slate-600 dark:text-slate-400">分數全部清空後儲存＝刪除這筆評分。</p>

        <div class="flex items-center justify-end gap-2 pt-1">
          <span v-if="error" class="text-xs text-red-700 dark:text-red-400 mr-auto">{{ error }}</span>
          <button type="button" class="btn-secondary text-sm" @click="clearCell">清空</button>
          <button type="button" class="btn-secondary text-sm" @click="edit = null">取消</button>
          <button type="button" class="btn-primary text-sm" :disabled="busy" @click="saveCell">
            {{ busy ? '處理中…' : '儲存' }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
