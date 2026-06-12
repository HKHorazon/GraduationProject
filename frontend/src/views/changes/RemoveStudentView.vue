<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import { Search, X, ArrowRightLeft, UserMinus, UserPlus, Check, UserX, ChevronRight, GraduationCap, Users, ShieldOff } from 'lucide-vue-next'
import { rocYear, yearClass } from '@/lib/year'
import StudentName from '@/components/common/StudentName.vue'
import GroupName from '@/components/common/GroupName.vue'

const auth = useAuthStore()
const data = useDataStore()
const route = useRoute()

// 連動：?student=<id> 直接選取該學生（全站人名點擊都導到這裡）
function applyRouteStudent() {
  const id = route.query.student
  if (!id || !data.loaded) return
  const s = data.students.find((x) => x.id === id)
  if (s) {
    selectStudent(s)
    query.value = s.student_id // 左側列表同步顯示
  }
}

watch([() => route.query.student, () => data.loaded], applyRouteStudent)

onMounted(async () => {
  await data.loadAll()
  applyRouteStudent()
})

function groupLabel(g) {
  return `${rocYear(g.school_year)} 學年 第${g.number}組 — ${g.name}`
}
function getTeacherNames(g) {
  if (!g) return '—'
  return g.teacher_ids.map(tid => data.teachers.find(t => t.id === tid)?.name ?? tid).join('、')
}

const query = ref('')
const selected = ref(null)
const activeTab = ref(null)
const targetGroupId = ref('')
const toast = ref(null)
const withdrawStep = ref(1)
const busy = ref(false)

function getStudentTeacherNames(s) {
  const g = data.groups.find(grp => grp.id === s.group_id)
  if (!g) return ''
  return g.teacher_ids.map(tid => data.teachers.find(t => t.id === tid)?.name ?? '').join(' ')
}

const RESULT_LIMIT = 30

const results = computed(() => {
  const q = query.value.trim()
  if (!q) return []
  const lower = q.toLowerCase()
  return data.students.filter(s =>
    s.name.includes(q) ||
    s.student_id.toLowerCase().includes(lower) ||
    getStudentTeacherNames(s).includes(q)
  )
})
const limitedResults = computed(() => results.value.slice(0, RESULT_LIMIT))

function groupNumber(groupId) {
  return data.groups.find(g => g.id === groupId)?.number ?? null
}
function groupOf(s) {
  return s.group_id ? data.groups.find(g => g.id === s.group_id) ?? null : null
}
function groupMembers(groupId) {
  return data.students.filter(s => s.group_id === groupId)
}

function selectStudent(s) {
  selected.value = s
  activeTab.value = null
  targetGroupId.value = ''
  withdrawStep.value = 1
}

function clearSearch() {
  query.value = ''
  selected.value = null
  activeTab.value = null
  targetGroupId.value = ''
  toast.value = null
  withdrawStep.value = 1
}

const currentGroup = computed(() =>
  selected.value?.group_id
    ? data.groups.find(g => g.id === selected.value.group_id) ?? null
    : null
)
const sameYearGroups = computed(() => {
  if (!selected.value) return []
  return data.groups.filter(g =>
    g.school_year === selected.value.school_year &&
    g.id !== selected.value.group_id
  )
})
const isInactive = computed(() => selected.value?.status === 'inactive')
const hasGroup = computed(() => !!selected.value?.group_id)

const TABS = [
  {
    key: 'move',
    label: '移動到其他組',
    icon: ArrowRightLeft,
    enabled: () => !isInactive.value && hasGroup.value,
    color: 'cyan',
  },
  {
    key: 'remove',
    label: '移除出組',
    icon: UserMinus,
    enabled: () => !isInactive.value && hasGroup.value,
    color: 'orange',
  },
  {
    key: 'join',
    label: '加入組別',
    icon: UserPlus,
    enabled: () => !isInactive.value && !hasGroup.value,
    color: 'cyan',
  },
  {
    key: 'withdraw',
    label: '休退學',
    icon: UserX,
    enabled: () => !isInactive.value,
    color: 'red',
  },
]

const TAB_ACTIVE_CLASS = {
  cyan:   'border-cyan-400 text-cyan-400 bg-cyan-400/5',
  orange: 'border-orange-400 text-orange-400 bg-orange-400/5',
  red:    'border-red-400 text-red-400 bg-red-400/5',
}

function clickTab(tab) {
  if (!tab.enabled()) return
  activeTab.value = activeTab.value === tab.key ? null : tab.key
  targetGroupId.value = ''
  withdrawStep.value = 1
}

function showToast(type, msg) {
  toast.value = { type, msg }
  setTimeout(() => { toast.value = null }, 3500)
}

async function applyPatch(patch) {
  if (busy.value) return false
  busy.value = true
  try {
    selected.value = await data.updateStudent(selected.value.id, patch)
    return true
  } catch (e) {
    showToast('warning', e.message ?? '操作失敗')
    return false
  } finally {
    busy.value = false
  }
}

async function confirmMove() {
  if (!targetGroupId.value || !selected.value) return
  const toGroup = data.groups.find(g => g.id === targetGroupId.value)
  const fromGroup = currentGroup.value
  if (await applyPatch({ group_id: targetGroupId.value })) {
    showToast('success', `${selected.value.name} 已從「${fromGroup?.name}」移動到「${toGroup?.name}」`)
    activeTab.value = null
    targetGroupId.value = ''
  }
}

async function confirmRemove() {
  if (!selected.value) return
  const fromGroup = currentGroup.value
  if (await applyPatch({ group_id: null })) {
    showToast('success', `${selected.value.name} 已從「${fromGroup?.name}」移除`)
    activeTab.value = null
  }
}

async function confirmJoin() {
  if (!targetGroupId.value || !selected.value) return
  const toGroup = data.groups.find(g => g.id === targetGroupId.value)
  if (await applyPatch({ group_id: targetGroupId.value })) {
    showToast('success', `${selected.value.name} 已加入「${toGroup?.name}」`)
    activeTab.value = null
    targetGroupId.value = ''
  }
}

async function confirmWithdraw() {
  if (!selected.value) return
  const fromGroup = currentGroup.value
  if (await applyPatch({ status: 'inactive', group_id: null })) {
    const suffix = fromGroup ? `，已自「${fromGroup.name}」移除` : ''
    showToast('warning', `${selected.value.name} 已標記為休退學${suffix}`)
    activeTab.value = null
    withdrawStep.value = 1
  }
}
</script>

<template>
  <AppLayout>
    <!-- 編輯權限守門：學生更動是編輯功能，未登入/viewer 不可見（個資保護） -->
    <div v-if="!auth.isEditor"
         class="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#2a3347] flex items-center justify-center">
        <ShieldOff class="w-6 h-6 text-slate-400" />
      </div>
      <p class="font-semibold text-slate-700 dark:text-slate-300">無編輯權限</p>
      <p class="text-sm text-slate-400">此頁面僅限編輯者使用</p>
    </div>

    <!-- stu-change: light-mode parchment overrides are scoped to this class in main.css -->
    <div v-else class="stu-change flex gap-6 h-full">

      <!-- ═══ LEFT: Search panel ═══ -->
      <div class="w-96 flex-shrink-0 flex flex-col gap-5">

        <!-- Title -->
        <div>
          <div class="flex items-center gap-2 mb-0.5">
            <div class="w-1 h-5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.7)]"></div>
            <h2 class="font-display font-semibold text-base tracking-widest uppercase text-slate-700 dark:text-slate-300">
              學生更動
            </h2>
          </div>
          <p class="text-xs text-slate-500 pl-3">搜尋並選取學生以調整其組別</p>
        </div>

        <!-- Search input (large) -->
        <div class="relative group">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
          <input
            v-model="query"
            type="text"
            placeholder="搜尋學號 / 姓名 / 老師…"
            class="w-full pl-12 pr-10 py-4 text-base rounded-xl outline-none transition-all duration-200
                   bg-white dark:bg-dark-card border border-slate-300 dark:border-dark-border
                   text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600
                   focus:border-cyan-500 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.2),0_0_12px_rgba(34,211,238,0.1)]
                   font-mono tracking-wide"
          />
          <button
            v-if="query"
            @click="clearSearch"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center
                   rounded text-slate-500 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-400
                   hover:bg-slate-100 dark:hover:bg-dark-border transition-colors cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- No results -->
        <div v-if="query && results.length === 0"
             class="text-center py-8 text-xs text-slate-500 tracking-wider">
          — 找不到「{{ query }}」—
        </div>

        <!-- Results -->
        <div v-if="results.length > 0" class="flex flex-col min-h-0 flex-1">
          <p class="text-[11px] font-mono text-slate-500 tracking-wider px-1 mb-2 flex-shrink-0">
            搜尋到 {{ results.length }} 筆結果<span v-if="results.length > RESULT_LIMIT" class="text-slate-400 dark:text-slate-600">，只顯示前 {{ RESULT_LIMIT }} 筆</span>
          </p>
          <div class="flex flex-col gap-2 overflow-y-auto pr-1">
            <button
              v-for="s in limitedResults"
              :key="s.id"
              @click="selectStudent(s)"
              class="w-full flex flex-col gap-2 p-3 rounded-lg border text-left
                     transition-all duration-150 cursor-pointer relative overflow-hidden flex-shrink-0"
              :class="selected?.id === s.id
                ? 'border-cyan-500/50 bg-cyan-400/5 shadow-[0_0_12px_rgba(34,211,238,0.08)]'
                : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-[#1e2535]/80'"
            >
              <!-- Active left bar -->
              <div v-if="selected?.id === s.id"
                   class="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]">
              </div>

              <!-- Top row -->
              <div class="flex items-center gap-3">
                <!-- LEFT: 名字 / 學號 -->
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium truncate"
                     :class="s.status === 'inactive' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'">
                    {{ s.name }}
                  </p>
                  <p class="text-xs font-mono text-slate-500 tracking-wider truncate">{{ s.student_id }}</p>
                </div>

                <!-- MIDDLE: 學年+班級 / 指導老師 -->
                <div class="min-w-0 max-w-[42%] flex flex-col items-end gap-0.5 text-right">
                  <p class="text-xs truncate w-full"
                     :class="s.status === 'inactive' ? 'text-slate-400 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300'">
                    {{ rocYear(s.school_year) }}{{ s.class_ || '' }}
                  </p>
                  <p class="text-[11px] text-slate-500 truncate w-full">
                    {{ getStudentTeacherNames(s).trim() || '—' }}
                  </p>
                </div>

                <!-- FAR RIGHT: 組號 -->
                <div class="w-11 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                            text-sm font-display font-bold leading-none text-center border"
                     :class="s.status === 'inactive'
                       ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 border-amber-300 dark:border-amber-700/40'
                       : s.group_id
                         ? (selected?.id === s.id
                             ? 'bg-cyan-400/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/40'
                             : 'bg-slate-100 dark:bg-dark-border text-cyan-600 dark:text-cyan-400 border-slate-200 dark:border-dark-border')
                         : 'bg-slate-100 dark:bg-dark-border text-slate-500 border-slate-200 dark:border-dark-border'">
                  {{ s.status === 'inactive' ? '休退' : (s.group_id ? groupNumber(s.group_id) : '—') }}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══ RIGHT: Action panel ═══ -->
      <div class="flex-1 min-w-0 flex flex-col gap-4">

        <!-- Empty state -->
        <div v-if="!selected"
             class="flex-1 flex flex-col items-center justify-center gap-4
                    border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
          <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border
                      flex items-center justify-center">
            <Search class="w-5 h-5 text-slate-400 dark:text-slate-600" />
          </div>
          <p class="text-xs text-slate-400 dark:text-slate-600 tracking-widest font-mono uppercase">SELECT A STUDENT</p>
        </div>

        <template v-else>
          <!-- ── Student card ── -->
          <div class="rounded-xl border overflow-hidden"
               :class="isInactive
                 ? 'border-amber-300 dark:border-amber-700/40 shadow-[0_0_20px_rgba(217,119,6,0.06)]'
                 : 'border-slate-200 dark:border-dark-border shadow-[0_0_20px_rgba(34,211,238,0.04)]'">

            <!-- Inactive banner -->
            <div v-if="isInactive"
                 class="flex items-center gap-2 px-4 py-2 text-xs font-mono tracking-wider
                        bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700/30 text-amber-600 dark:text-amber-400">
              <UserX class="w-3.5 h-3.5" />
              INACTIVE — 此學生已休退學，無法調整組別
            </div>

            <div class="bg-white dark:bg-dark-card px-5 py-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-center gap-3">
                  <!-- Large avatar -->
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                              text-base font-display font-bold border"
                       :class="isInactive
                         ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700/50'
                         : 'bg-cyan-50 dark:bg-cyan-400/10 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.15)]'">
                    {{ selected.name[0] }}
                  </div>
                  <div>
                    <p class="font-display font-semibold text-slate-900 dark:text-white text-base leading-tight">{{ selected.name }}</p>
                    <p class="text-xs font-mono text-slate-500 mt-0.5 tracking-wider">
                      {{ selected.student_id }} · {{ yearClass(selected.school_year, selected.class_) }}
                    </p>
                  </div>
                </div>

                <!-- Badges -->
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span v-if="isInactive"
                        class="text-[10px] font-mono px-2 py-1 rounded border tracking-wider
                               border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                    INACTIVE
                  </span>
                  <span class="text-[10px] font-mono px-2 py-1 rounded border tracking-wider"
                        :class="currentGroup
                          ? 'border-cyan-400/40 bg-cyan-50 dark:bg-cyan-400/8 text-cyan-600 dark:text-cyan-400'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-dark-border/50 text-slate-500'">
                    {{ currentGroup ? `GROUP ${currentGroup.number}` : 'UNASSIGNED' }}
                  </span>
                </div>
              </div>

              <!-- Group info (detailed) -->
              <div v-if="currentGroup"
                   class="mt-3 rounded-lg bg-slate-50 dark:bg-[#0f1520] border border-slate-200 dark:border-dark-border/60 overflow-hidden">
                <div class="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 dark:border-dark-border/60">
                  <span class="text-[11px] font-mono text-cyan-600 dark:text-cyan-500 flex-shrink-0">第 {{ currentGroup.number }} 組</span>
                  <ChevronRight class="w-3 h-3 text-slate-400 dark:text-slate-600 flex-shrink-0" />
                  <p class="text-sm text-slate-800 dark:text-slate-200 font-medium truncate flex-1"><GroupName :group="currentGroup" /></p>
                  <span v-if="currentGroup.category"
                        class="text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0
                               border border-cyan-400/30 bg-cyan-50 dark:bg-cyan-400/5 text-cyan-600 dark:text-cyan-400">
                    {{ currentGroup.category }}
                  </span>
                </div>

                <div class="px-3 py-2.5 space-y-2">
                  <div class="flex items-start gap-2 text-xs">
                    <GraduationCap class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mt-px flex-shrink-0" />
                    <div class="min-w-0">
                      <span class="text-slate-500 font-mono">指導老師：</span>
                      <span class="text-slate-700 dark:text-slate-300">{{ getTeacherNames(currentGroup) }}</span>
                    </div>
                  </div>

                  <div class="flex items-start gap-2 text-xs">
                    <Users class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mt-px flex-shrink-0" />
                    <div class="min-w-0 flex-1">
                      <span class="text-slate-500 font-mono">組員（{{ groupMembers(currentGroup.id).length }}）：</span>
                      <template v-for="(m, i) in groupMembers(currentGroup.id)" :key="m.id"><span :class="[
                          m.id === currentGroup.leader_id ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-700 dark:text-slate-300',
                          m.id === selected.id ? 'underline decoration-cyan-500/60 underline-offset-2' : ''
                        ]"><StudentName :student="m" /></span><span v-if="i < groupMembers(currentGroup.id).length - 1" class="text-slate-400 dark:text-slate-600">、</span></template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Tabs ── -->
          <div class="flex-1 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden flex flex-col">
            <!-- Tab bar -->
            <div class="flex border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-[#0f1520]">
              <button
                v-for="tab in TABS"
                :key="tab.key"
                @click="clickTab(tab)"
                :disabled="!tab.enabled()"
                class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5
                       text-xs font-display font-medium tracking-wide
                       border-b-2 -mb-px transition-all duration-150"
                :class="!tab.enabled()
                  ? 'border-transparent text-slate-400 dark:text-slate-700 cursor-not-allowed'
                  : activeTab === tab.key
                    ? TAB_ACTIVE_CLASS[tab.color] + ' cursor-pointer'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/3 cursor-pointer'"
              >
                <component :is="tab.icon" class="w-3.5 h-3.5 flex-shrink-0" />
                <span class="hidden sm:inline">{{ tab.label }}</span>
              </button>
            </div>

            <!-- Tab content -->
            <div class="p-5 flex-1">

              <!-- No tab selected -->
              <div v-if="!activeTab"
                   class="h-full flex flex-col items-center justify-center gap-2 text-center">
                <p class="text-xs font-mono text-slate-400 dark:text-slate-700 tracking-widest uppercase">
                  {{ isInactive ? '— INACTIVE —' : '↑ SELECT OPERATION' }}
                </p>
              </div>

              <!-- MOVE -->
              <div v-else-if="activeTab === 'move'" class="space-y-4">
                <p class="text-[10px] font-mono text-cyan-600 dark:text-cyan-500 tracking-widest uppercase">// 目標組別</p>
                <select v-model="targetGroupId"
                  class="w-full px-3 py-2.5 text-sm rounded-lg border outline-none cursor-pointer transition-all
                         bg-white dark:bg-[#0f1520] border-slate-300 dark:border-dark-border text-slate-700 dark:text-slate-300
                         focus:border-cyan-500/60 focus:shadow-[0_0_8px_rgba(34,211,238,0.1)]
                         font-mono dark:[color-scheme:dark]">
                  <option value="">— 請選擇組別 —</option>
                  <option v-for="g in sameYearGroups" :key="g.id" :value="g.id">{{ groupLabel(g) }}</option>
                </select>

                <div v-if="targetGroupId"
                     class="rounded-lg border border-cyan-500/20 bg-cyan-50 dark:bg-cyan-400/5 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                  <span class="text-cyan-600 dark:text-cyan-400 font-semibold">{{ selected.name }}</span>
                  　<span class="text-slate-400 dark:text-slate-600 font-mono text-xs">→</span>
                  　{{ data.groups.find(g => g.id === targetGroupId)?.name }}
                </div>

                <div class="flex gap-2 pt-1">
                  <button @click="confirmMove" :disabled="!targetGroupId"
                    class="flex-1 py-2.5 rounded-lg text-sm font-display font-semibold transition-all cursor-pointer
                           bg-cyan-400 text-dark-bg hover:bg-cyan-300
                           shadow-[0_0_12px_rgba(34,211,238,0.3)] hover:shadow-[0_0_18px_rgba(34,211,238,0.45)]
                           disabled:opacity-25 disabled:cursor-not-allowed disabled:shadow-none">
                    確認移動
                  </button>
                  <button @click="activeTab = null; targetGroupId = ''"
                    class="px-4 py-2.5 rounded-lg text-sm text-slate-500 cursor-pointer
                           border border-slate-200 dark:border-dark-border hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-400 transition-colors">
                    取消
                  </button>
                </div>
              </div>

              <!-- REMOVE -->
              <div v-else-if="activeTab === 'remove'" class="space-y-4">
                <div class="rounded-lg border border-orange-300 dark:border-orange-500/25 bg-orange-50 dark:bg-orange-400/5 px-4 py-3 space-y-1">
                  <p class="text-sm text-slate-700 dark:text-slate-300">
                    將 <span class="text-orange-600 dark:text-orange-400 font-semibold">{{ selected.name }}</span>
                    從「{{ currentGroup?.name }}」移除？
                  </p>
                  <p class="text-xs font-mono text-slate-500">移除後學生將變為 UNASSIGNED 狀態。</p>
                </div>
                <div class="flex gap-2">
                  <button @click="confirmRemove"
                    class="flex-1 py-2.5 rounded-lg text-sm font-display font-semibold transition-all cursor-pointer
                           bg-orange-500 text-white hover:bg-orange-400
                           shadow-[0_0_12px_rgba(249,115,22,0.3)] hover:shadow-[0_0_18px_rgba(249,115,22,0.45)]">
                    確認移除
                  </button>
                  <button @click="activeTab = null"
                    class="px-4 py-2.5 rounded-lg text-sm text-slate-500 cursor-pointer
                           border border-slate-200 dark:border-dark-border hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-400 transition-colors">
                    取消
                  </button>
                </div>
              </div>

              <!-- JOIN -->
              <div v-else-if="activeTab === 'join'" class="space-y-4">
                <p class="text-[10px] font-mono text-cyan-600 dark:text-cyan-500 tracking-widest uppercase">// 加入組別</p>
                <select v-model="targetGroupId"
                  class="w-full px-3 py-2.5 text-sm rounded-lg border outline-none cursor-pointer transition-all
                         bg-white dark:bg-[#0f1520] border-slate-300 dark:border-dark-border text-slate-700 dark:text-slate-300
                         focus:border-cyan-500/60 focus:shadow-[0_0_8px_rgba(34,211,238,0.1)]
                         font-mono dark:[color-scheme:dark]">
                  <option value="">— 請選擇組別 —</option>
                  <option v-for="g in sameYearGroups" :key="g.id" :value="g.id">{{ groupLabel(g) }}</option>
                </select>

                <div v-if="targetGroupId"
                     class="rounded-lg border border-cyan-500/20 bg-cyan-50 dark:bg-cyan-400/5 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                  <span class="text-cyan-600 dark:text-cyan-400 font-semibold">{{ selected.name }}</span>
                  　加入　{{ data.groups.find(g => g.id === targetGroupId)?.name }}
                </div>

                <div class="flex gap-2 pt-1">
                  <button @click="confirmJoin" :disabled="!targetGroupId"
                    class="flex-1 py-2.5 rounded-lg text-sm font-display font-semibold transition-all cursor-pointer
                           bg-cyan-400 text-dark-bg hover:bg-cyan-300
                           shadow-[0_0_12px_rgba(34,211,238,0.3)] hover:shadow-[0_0_18px_rgba(34,211,238,0.45)]
                           disabled:opacity-25 disabled:cursor-not-allowed disabled:shadow-none">
                    確認加入
                  </button>
                  <button @click="activeTab = null; targetGroupId = ''"
                    class="px-4 py-2.5 rounded-lg text-sm text-slate-500 cursor-pointer
                           border border-slate-200 dark:border-dark-border hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-400 transition-colors">
                    取消
                  </button>
                </div>
              </div>

              <!-- WITHDRAW step 1 -->
              <div v-else-if="activeTab === 'withdraw' && withdrawStep === 1" class="space-y-4">
                <div class="rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 px-4 py-3 space-y-2">
                  <p class="text-xs font-mono text-red-600 dark:text-red-400 tracking-widest uppercase font-semibold">⚠ WARNING</p>
                  <ul class="space-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <li v-if="currentGroup" class="flex items-start gap-2">
                      <span class="text-red-500 mt-px">›</span>
                      將自「{{ currentGroup.name }}」移除
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-red-500 mt-px">›</span>
                      無法再被加入任何組別
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-slate-400 dark:text-slate-600 mt-px">›</span>
                      資料保留，可用相同學號在其他學年重新建立
                    </li>
                  </ul>
                </div>
                <div class="flex gap-2">
                  <button @click="withdrawStep = 2"
                    class="flex-1 py-2.5 rounded-lg text-sm font-display font-semibold transition-all cursor-pointer
                           bg-red-500 text-white hover:bg-red-400
                           shadow-[0_0_12px_rgba(239,68,68,0.3)] hover:shadow-[0_0_18px_rgba(239,68,68,0.45)]">
                    我了解，繼續操作
                  </button>
                  <button @click="activeTab = null; withdrawStep = 1"
                    class="px-4 py-2.5 rounded-lg text-sm text-slate-500 cursor-pointer
                           border border-slate-200 dark:border-dark-border hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-400 transition-colors">
                    取消
                  </button>
                </div>
              </div>

              <!-- WITHDRAW step 2 -->
              <div v-else-if="activeTab === 'withdraw' && withdrawStep === 2" class="space-y-4">
                <div class="rounded-lg border border-red-400 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10 px-4 py-3 space-y-2
                            shadow-[0_0_16px_rgba(239,68,68,0.1)]">
                  <p class="text-xs font-mono text-red-600 dark:text-red-400 tracking-widest uppercase font-bold">⛔ FINAL CONFIRM</p>
                  <p class="text-sm text-slate-700 dark:text-slate-300">
                    確定將
                    <span class="text-red-500 dark:text-red-400 font-semibold font-display">{{ selected.name }}</span>
                    <span class="font-mono text-xs text-slate-500 ml-1">（{{ selected.student_id }}）</span>
                    標記為休退學？
                  </p>
                  <p class="text-xs font-mono text-red-500/70">此操作將立即生效。</p>
                </div>
                <div class="flex gap-2">
                  <button @click="confirmWithdraw"
                    class="flex-1 py-2.5 rounded-lg text-sm font-display font-bold tracking-wide transition-all cursor-pointer
                           bg-red-600 text-white hover:bg-red-500
                           shadow-[0_0_16px_rgba(239,68,68,0.35)] hover:shadow-[0_0_24px_rgba(239,68,68,0.5)]">
                    確認休退學
                  </button>
                  <button @click="withdrawStep = 1"
                    class="px-4 py-2.5 rounded-lg text-sm text-slate-500 cursor-pointer
                           border border-slate-200 dark:border-dark-border hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-400 transition-colors">
                    返回
                  </button>
                </div>
              </div>

            </div>
          </div>

          <!-- Toast -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100" leave-to-class="opacity-0"
          >
            <div v-if="toast"
                 class="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-mono border"
                 :class="toast.type === 'success'
                   ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.1)]'
                   : 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700/40 text-amber-700 dark:text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.1)]'">
              <Check class="w-4 h-4 flex-shrink-0" />
              {{ toast.msg }}
            </div>
          </Transition>
        </template>
      </div>
    </div>
  </AppLayout>
</template>
