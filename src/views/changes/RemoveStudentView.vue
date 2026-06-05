<script setup>
import { ref, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { groups } from '@/data/groups'
import { students } from '@/data/students'
import { teachers } from '@/data/teachers'
import { Search, X, ArrowRightLeft, UserMinus, UserPlus, Check, UserX, ChevronRight } from 'lucide-vue-next'

function toRoc(schoolYear) {
  const y = parseInt(schoolYear.split('-')[0]) - 1911
  return `${y} 學年`
}
function groupLabel(g) {
  return `${toRoc(g.school_year)} 第${g.number}組 — ${g.name}`
}
function getTeacherNames(g) {
  if (!g) return '—'
  return g.teacher_ids.map(tid => teachers.find(t => t.id === tid)?.name ?? tid).join('、')
}

const query = ref('')
const selected = ref(null)
const activeTab = ref(null)
const targetGroupId = ref('')
const toast = ref(null)
const withdrawStep = ref(1)

function getStudentTeacherNames(s) {
  const g = groups.find(grp => grp.id === s.group_id)
  if (!g) return ''
  return g.teacher_ids.map(tid => teachers.find(t => t.id === tid)?.name ?? '').join(' ')
}

const results = computed(() => {
  const q = query.value.trim()
  if (!q) return []
  const lower = q.toLowerCase()
  return students.filter(s =>
    s.name.includes(q) ||
    s.student_id.toLowerCase().includes(lower) ||
    getStudentTeacherNames(s).includes(q)
  )
})

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
    ? groups.find(g => g.id === selected.value.group_id) ?? null
    : null
)
const sameYearGroups = computed(() => {
  if (!selected.value) return []
  return groups.filter(g =>
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

function confirmMove() {
  if (!targetGroupId.value || !selected.value) return
  const toGroup = groups.find(g => g.id === targetGroupId.value)
  const fromGroup = currentGroup.value
  selected.value.group_id = targetGroupId.value
  showToast('success', `${selected.value.name} 已從「${fromGroup?.name}」移動到「${toGroup?.name}」`)
  activeTab.value = null
  targetGroupId.value = ''
}

function confirmRemove() {
  if (!selected.value) return
  const fromGroup = currentGroup.value
  selected.value.group_id = null
  showToast('success', `${selected.value.name} 已從「${fromGroup?.name}」移除`)
  activeTab.value = null
}

function confirmJoin() {
  if (!targetGroupId.value || !selected.value) return
  const toGroup = groups.find(g => g.id === targetGroupId.value)
  selected.value.group_id = targetGroupId.value
  showToast('success', `${selected.value.name} 已加入「${toGroup?.name}」`)
  activeTab.value = null
  targetGroupId.value = ''
}

function confirmWithdraw() {
  if (!selected.value) return
  const fromGroup = currentGroup.value
  selected.value.status = 'inactive'
  selected.value.group_id = null
  const suffix = fromGroup ? `，已自「${fromGroup.name}」移除` : ''
  showToast('warning', `${selected.value.name} 已標記為休退學${suffix}`)
  activeTab.value = null
  withdrawStep.value = 1
}
</script>

<template>
  <AppLayout>
    <div class="flex gap-6 h-full">

      <!-- ═══ LEFT: Search panel ═══ -->
      <div class="w-72 flex-shrink-0 flex flex-col gap-5">

        <!-- Title -->
        <div>
          <div class="flex items-center gap-2 mb-0.5">
            <div class="w-1 h-4 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.7)]"></div>
            <h2 class="font-display font-semibold text-sm tracking-widest uppercase text-slate-300">
              學生更動
            </h2>
          </div>
          <p class="text-xs text-slate-500 pl-3">搜尋並選取學生以調整其組別</p>
        </div>

        <!-- Search input -->
        <div class="relative group">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
          <input
            v-model="query"
            type="text"
            placeholder="學號 / 姓名..."
            class="w-full pl-9 pr-8 py-2.5 text-sm rounded-lg outline-none transition-all duration-200
                   bg-dark-card border border-dark-border
                   text-slate-200 placeholder-slate-600
                   focus:border-cyan-500 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.2),0_0_12px_rgba(34,211,238,0.1)]
                   font-mono tracking-wide"
          />
          <button
            v-if="query"
            @click="clearSearch"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center
                   rounded text-slate-600 hover:text-slate-400 hover:bg-dark-border transition-colors cursor-pointer"
          >
            <X class="w-3 h-3" />
          </button>
        </div>

        <!-- No results -->
        <div v-if="query && results.length === 0"
             class="text-center py-8 text-xs text-slate-600 tracking-wider">
          — 找不到「{{ query }}」—
        </div>

        <!-- Results -->
        <div v-if="results.length > 0" class="flex flex-col gap-1 overflow-y-auto flex-1">
          <p class="text-[10px] font-mono text-slate-600 tracking-widest uppercase px-1 mb-1">
            {{ results.length }} RESULTS
          </p>
          <button
            v-for="s in results"
            :key="s.id"
            @click="selectStudent(s)"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left
                   transition-all duration-150 cursor-pointer group/item relative overflow-hidden"
            :class="selected?.id === s.id
              ? 'border-cyan-500/50 bg-cyan-400/5 shadow-[0_0_12px_rgba(34,211,238,0.08)]'
              : 'border-dark-border bg-dark-card hover:border-slate-600 hover:bg-[#1e2535]/80'"
          >
            <!-- Active left bar -->
            <div v-if="selected?.id === s.id"
                 class="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]">
            </div>

            <!-- Avatar -->
            <div class="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-display font-bold transition-all"
                 :class="s.status === 'inactive'
                   ? 'bg-amber-900/30 text-amber-500 border border-amber-700/40'
                   : selected?.id === s.id
                     ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
                     : 'bg-dark-border text-slate-400 border border-transparent'">
              {{ s.name[0] }}
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-medium truncate"
                      :class="s.status === 'inactive' ? 'text-slate-500' : 'text-slate-200'">
                  {{ s.name }}
                </span>
                <span v-if="s.status === 'inactive'"
                      class="flex-shrink-0 text-[9px] px-1.5 py-px rounded font-mono font-medium tracking-wider
                             border border-amber-700/50 bg-amber-900/20 text-amber-500">
                  INACTIVE
                </span>
              </div>
              <p class="text-[11px] font-mono text-slate-600 tracking-wider">{{ s.student_id }}</p>
              <p v-if="getStudentTeacherNames(s)" class="text-[11px] text-slate-600 truncate mt-0.5">
                {{ getStudentTeacherNames(s) }}
              </p>
            </div>

            <div class="flex-shrink-0 text-right">
              <span class="text-[10px] font-mono"
                    :class="s.group_id ? 'text-cyan-500' : 'text-slate-600'">
                {{ s.group_id ? `G${groups.find(g=>g.id===s.group_id)?.number}` : '—' }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- ═══ RIGHT: Action panel ═══ -->
      <div class="flex-1 min-w-0 flex flex-col gap-4">

        <!-- Empty state -->
        <div v-if="!selected"
             class="flex-1 flex flex-col items-center justify-center gap-4
                    border border-dashed border-slate-800 rounded-xl">
          <div class="w-12 h-12 rounded-xl bg-dark-card border border-dark-border
                      flex items-center justify-center">
            <Search class="w-5 h-5 text-slate-600" />
          </div>
          <p class="text-xs text-slate-600 tracking-widest font-mono uppercase">SELECT A STUDENT</p>
        </div>

        <template v-else>
          <!-- ── Student card ── -->
          <div class="rounded-xl border overflow-hidden"
               :class="isInactive
                 ? 'border-amber-700/40 shadow-[0_0_20px_rgba(217,119,6,0.06)]'
                 : 'border-dark-border shadow-[0_0_20px_rgba(34,211,238,0.04)]'">

            <!-- Inactive banner -->
            <div v-if="isInactive"
                 class="flex items-center gap-2 px-4 py-2 text-xs font-mono tracking-wider
                        bg-amber-900/20 border-b border-amber-700/30 text-amber-400">
              <UserX class="w-3.5 h-3.5" />
              INACTIVE — 此學生已休退學，無法調整組別
            </div>

            <div class="bg-dark-card px-5 py-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-center gap-3">
                  <!-- Large avatar -->
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                              text-base font-display font-bold border"
                       :class="isInactive
                         ? 'bg-amber-900/30 text-amber-400 border-amber-700/50'
                         : 'bg-cyan-400/10 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.15)]'">
                    {{ selected.name[0] }}
                  </div>
                  <div>
                    <p class="font-display font-semibold text-white text-base leading-tight">{{ selected.name }}</p>
                    <p class="text-xs font-mono text-slate-500 mt-0.5 tracking-wider">
                      {{ selected.student_id }} · {{ selected.class }} · {{ toRoc(selected.school_year) }}
                    </p>
                  </div>
                </div>

                <!-- Badges -->
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span v-if="isInactive"
                        class="text-[10px] font-mono px-2 py-1 rounded border tracking-wider
                               border-amber-700/50 bg-amber-900/20 text-amber-400">
                    INACTIVE
                  </span>
                  <span class="text-[10px] font-mono px-2 py-1 rounded border tracking-wider"
                        :class="currentGroup
                          ? 'border-cyan-500/40 bg-cyan-400/8 text-cyan-400'
                          : 'border-slate-700 bg-dark-border/50 text-slate-500'">
                    {{ currentGroup ? `GROUP ${currentGroup.number}` : 'UNASSIGNED' }}
                  </span>
                </div>
              </div>

              <!-- Group info -->
              <div v-if="currentGroup"
                   class="mt-3 px-3 py-2.5 rounded-lg bg-[#0f1520] border border-dark-border/60">
                <div class="flex items-center gap-2">
                  <ChevronRight class="w-3 h-3 text-cyan-500 flex-shrink-0" />
                  <p class="text-sm text-slate-300 font-medium">{{ currentGroup.name }}</p>
                </div>
                <p class="text-xs text-slate-600 mt-0.5 pl-5 font-mono">
                  指導：{{ getTeacherNames(currentGroup) }}
                </p>
              </div>
            </div>
          </div>

          <!-- ── Tabs ── -->
          <div class="flex-1 rounded-xl border border-dark-border bg-dark-card overflow-hidden flex flex-col">
            <!-- Tab bar -->
            <div class="flex border-b border-dark-border bg-[#0f1520]">
              <button
                v-for="tab in TABS"
                :key="tab.key"
                @click="clickTab(tab)"
                :disabled="!tab.enabled()"
                class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5
                       text-xs font-display font-medium tracking-wide
                       border-b-2 -mb-px transition-all duration-150"
                :class="!tab.enabled()
                  ? 'border-transparent text-slate-700 cursor-not-allowed'
                  : activeTab === tab.key
                    ? TAB_ACTIVE_CLASS[tab.color] + ' cursor-pointer'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/3 cursor-pointer'"
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
                <p class="text-xs font-mono text-slate-700 tracking-widest uppercase">
                  {{ isInactive ? '— INACTIVE —' : '↑ SELECT OPERATION' }}
                </p>
              </div>

              <!-- MOVE -->
              <div v-else-if="activeTab === 'move'" class="space-y-4">
                <p class="text-[10px] font-mono text-cyan-500 tracking-widest uppercase">// 目標組別</p>
                <select v-model="targetGroupId"
                  class="w-full px-3 py-2.5 text-sm rounded-lg border outline-none cursor-pointer transition-all
                         bg-[#0f1520] border-dark-border text-slate-300
                         focus:border-cyan-500/60 focus:shadow-[0_0_8px_rgba(34,211,238,0.1)]
                         font-mono">
                  <option value="">— 請選擇組別 —</option>
                  <option v-for="g in sameYearGroups" :key="g.id" :value="g.id">{{ groupLabel(g) }}</option>
                </select>

                <div v-if="targetGroupId"
                     class="rounded-lg border border-cyan-500/20 bg-cyan-400/5 px-4 py-3 text-sm text-slate-300">
                  <span class="text-cyan-400 font-semibold">{{ selected.name }}</span>
                  　<span class="text-slate-600 font-mono text-xs">→</span>
                  　{{ groups.find(g => g.id === targetGroupId)?.name }}
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
                           border border-dark-border hover:border-slate-600 hover:text-slate-400 transition-colors">
                    取消
                  </button>
                </div>
              </div>

              <!-- REMOVE -->
              <div v-else-if="activeTab === 'remove'" class="space-y-4">
                <div class="rounded-lg border border-orange-500/25 bg-orange-400/5 px-4 py-3 space-y-1">
                  <p class="text-sm text-slate-300">
                    將 <span class="text-orange-400 font-semibold">{{ selected.name }}</span>
                    從「{{ currentGroup?.name }}」移除？
                  </p>
                  <p class="text-xs font-mono text-slate-600">移除後學生將變為 UNASSIGNED 狀態。</p>
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
                           border border-dark-border hover:border-slate-600 hover:text-slate-400 transition-colors">
                    取消
                  </button>
                </div>
              </div>

              <!-- JOIN -->
              <div v-else-if="activeTab === 'join'" class="space-y-4">
                <p class="text-[10px] font-mono text-cyan-500 tracking-widest uppercase">// 加入組別</p>
                <select v-model="targetGroupId"
                  class="w-full px-3 py-2.5 text-sm rounded-lg border outline-none cursor-pointer transition-all
                         bg-[#0f1520] border-dark-border text-slate-300
                         focus:border-cyan-500/60 focus:shadow-[0_0_8px_rgba(34,211,238,0.1)]
                         font-mono">
                  <option value="">— 請選擇組別 —</option>
                  <option v-for="g in sameYearGroups" :key="g.id" :value="g.id">{{ groupLabel(g) }}</option>
                </select>

                <div v-if="targetGroupId"
                     class="rounded-lg border border-cyan-500/20 bg-cyan-400/5 px-4 py-3 text-sm text-slate-300">
                  <span class="text-cyan-400 font-semibold">{{ selected.name }}</span>
                  　加入　{{ groups.find(g => g.id === targetGroupId)?.name }}
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
                           border border-dark-border hover:border-slate-600 hover:text-slate-400 transition-colors">
                    取消
                  </button>
                </div>
              </div>

              <!-- WITHDRAW step 1 -->
              <div v-else-if="activeTab === 'withdraw' && withdrawStep === 1" class="space-y-4">
                <div class="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 space-y-2">
                  <p class="text-xs font-mono text-red-400 tracking-widest uppercase font-semibold">⚠ WARNING</p>
                  <ul class="space-y-1 text-xs text-slate-400 font-mono">
                    <li v-if="currentGroup" class="flex items-start gap-2">
                      <span class="text-red-500 mt-px">›</span>
                      將自「{{ currentGroup.name }}」移除
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-red-500 mt-px">›</span>
                      無法再被加入任何組別
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-slate-600 mt-px">›</span>
                      資料保留，可用相同學號在其他學年重新建立
                    </li>
                  </ul>
                </div>
                <div class="flex gap-2">
                  <button @click="withdrawStep = 2"
                    class="flex-1 py-2.5 rounded-lg text-sm font-display font-medium transition-all cursor-pointer
                           border border-red-500/50 text-red-400
                           hover:border-red-400 hover:bg-red-500/8 hover:text-red-300">
                    我了解，繼續操作
                  </button>
                  <button @click="activeTab = null; withdrawStep = 1"
                    class="px-4 py-2.5 rounded-lg text-sm text-slate-500 cursor-pointer
                           border border-dark-border hover:border-slate-600 hover:text-slate-400 transition-colors">
                    取消
                  </button>
                </div>
              </div>

              <!-- WITHDRAW step 2 -->
              <div v-else-if="activeTab === 'withdraw' && withdrawStep === 2" class="space-y-4">
                <div class="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 space-y-2
                            shadow-[0_0_16px_rgba(239,68,68,0.1)]">
                  <p class="text-xs font-mono text-red-400 tracking-widest uppercase font-bold">⛔ FINAL CONFIRM</p>
                  <p class="text-sm text-slate-300">
                    確定將
                    <span class="text-red-400 font-semibold font-display">{{ selected.name }}</span>
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
                           border border-dark-border hover:border-slate-600 hover:text-slate-400 transition-colors">
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
                   ? 'bg-emerald-900/20 border-emerald-700/40 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.1)]'
                   : 'bg-amber-900/20 border-amber-700/40 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.1)]'">
              <Check class="w-4 h-4 flex-shrink-0" />
              {{ toast.msg }}
            </div>
          </Transition>
        </template>
      </div>
    </div>
  </AppLayout>
</template>
