<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore } from '@/stores/permissions'
import NoAccess from '@/components/common/NoAccess.vue'
import { useDataStore } from '@/stores/data'
import {
  FolderPlus, X, Save, Trash2, Users, GraduationCap, Check, FileText, Search,
} from 'lucide-vue-next'
import { rocYear, yearClass } from '@/lib/year'
import StudentName from '@/components/common/StudentName.vue'

const auth = useAuthStore()
const perms = usePermissionsStore()
const data = useDataStore()
const route = useRoute()

// 連動：?group=<id> 直接選取該組（全站組別點擊都導到這裡）
function applyRouteGroup() {
  const id = route.query.group
  if (!id || !data.loaded) return
  const g = data.groups.find((x) => x.id === id)
  if (g) {
    selectGroup(g.id)
    search.value = g.name // 左側列表同步顯示
  }
}

watch([() => route.query.group, () => data.loaded], applyRouteGroup)

onMounted(async () => {
  await data.loadAll()
  applyRouteGroup()
})

// ---- filters / list ----
const filterYear = ref('')
const filterTeacher = ref('')
const search = ref('')
const years = computed(() =>
  [...new Set(data.groups.map((g) => g.school_year))].sort().reverse()
)

// the list only appears once the user has entered a search or picked a filter
const hasCriteria = computed(() =>
  !!(search.value.trim() || filterYear.value || filterTeacher.value)
)

// match a group against the search query: 題目 / 老師 / 學生姓名 / 學號 / 組號
function groupMatches(g, q) {
  if (g.name.toLowerCase().includes(q)) return true
  if (`第${g.number}組`.includes(q) || String(g.number) === q) return true
  if (g.category && g.category.toLowerCase().includes(q)) return true
  if (g.teacher_ids.some((tid) => teacherName(tid).toLowerCase().includes(q))) return true
  return members(g.id).some(
    (s) => s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q)
  )
}

const RESULT_LIMIT = 30

const filteredGroups = computed(() => {
  if (!hasCriteria.value) return []
  let list = [...data.groups]
  if (filterYear.value) list = list.filter((g) => g.school_year === filterYear.value)
  if (filterTeacher.value) list = list.filter((g) => g.teacher_ids.includes(filterTeacher.value))
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((g) => groupMatches(g, q))
  return list.sort((a, b) =>
    a.school_year === b.school_year
      ? a.number - b.number
      : b.school_year.localeCompare(a.school_year)
  )
})
const limitedGroups = computed(() => filteredGroups.value.slice(0, RESULT_LIMIT))

const selectedId = ref(null)
const selected = computed(() => data.groups.find((g) => g.id === selectedId.value) ?? null)

function selectGroup(id) {
  isCreating.value = false
  selectedId.value = id
}

function teacherName(id) {
  return data.teachers.find((t) => t.id === id)?.name ?? id
}
function members(groupId) {
  // leader first, rest keep their existing order
  const leaderId = data.groups.find((g) => g.id === groupId)?.leader_id
  return data.students
    .filter((s) => s.group_id === groupId)
    .sort((a, b) => (a.id === leaderId ? -1 : 0) - (b.id === leaderId ? -1 : 0))
}
const categories = computed(() =>
  [...new Set(data.groups.map((g) => g.category).filter(Boolean))]
)

// ---- editable copy of the selected group ----
const editName = ref('')
const editCategory = ref('')
const teacherIds = ref([])
const saving = ref(false)
const savedFlash = ref(false)
const editError = ref('')

watch(selected, (g) => {
  editName.value = g ? g.name : ''
  editCategory.value = g ? (g.category ?? '') : ''
  teacherIds.value = g ? [...g.teacher_ids] : []
  editError.value = ''
}, { immediate: true })

function toggleTeacher(id) {
  const i = teacherIds.value.indexOf(id)
  if (i === -1) teacherIds.value.push(id)
  else teacherIds.value.splice(i, 1)
}

const dirty = computed(() => {
  const g = selected.value
  if (!g) return false
  const teachersChanged =
    [...teacherIds.value].sort().join(',') !== [...g.teacher_ids].sort().join(',')
  return (
    editName.value.trim() !== g.name ||
    (editCategory.value.trim() || '') !== (g.category ?? '') ||
    teachersChanged
  )
})

async function saveChanges() {
  const g = selected.value
  if (!g || !dirty.value || saving.value) return
  if (!editName.value.trim()) { editError.value = '專題名稱不可空白'; return }
  saving.value = true
  editError.value = ''
  try {
    await data.updateGroup(g.id, {
      name: editName.value.trim(),
      category: editCategory.value.trim() || null,
      teacher_ids: teacherIds.value,
    })
    savedFlash.value = true
    setTimeout(() => { savedFlash.value = false }, 1500)
  } catch (e) {
    editError.value = e.message ?? '儲存失敗'
  } finally {
    saving.value = false
  }
}

// ---- create group (shown in the right panel, not a modal) ----
const isCreating = ref(false)
const createForm = ref({ school_year: '', number: null, name: '', category: '', teacher_ids: [] })
const createError = ref('')
const creating = ref(false)

function startCreate() {
  const year = filterYear.value || years.value[0] || ''
  const sameYear = data.groups.filter((g) => g.school_year === year)
  const nextNum = sameYear.length ? Math.max(...sameYear.map((g) => g.number)) + 1 : 1
  createForm.value = { school_year: year, number: nextNum, name: '', category: '', teacher_ids: [] }
  createError.value = ''
  selectedId.value = null
  isCreating.value = true
}

function cancelCreate() {
  isCreating.value = false
}

function toggleCreateTeacher(id) {
  const arr = createForm.value.teacher_ids
  const i = arr.indexOf(id)
  if (i === -1) arr.push(id)
  else arr.splice(i, 1)
}

async function submitCreate() {
  const f = createForm.value
  if (!String(f.school_year).trim()) { createError.value = '請填寫學年度（例如 114）'; return }
  if (!f.number) { createError.value = '請填寫組號'; return }
  if (!f.name.trim()) { createError.value = '請填寫專題名稱'; return }
  if (creating.value) return
  creating.value = true
  createError.value = ''
  try {
    const created = await data.createGroup({
      school_year: String(f.school_year).trim(),
      number: Number(f.number),
      name: f.name.trim(),
      category: f.category.trim() || null,
      leader_id: null,
      teacher_ids: f.teacher_ids,
    })
    isCreating.value = false
    selectedId.value = created.id
  } catch (e) {
    createError.value = e.message ?? '新增失敗'
  } finally {
    creating.value = false
  }
}

// ---- disband (delete) group ----
const confirmDisband = ref(false)
const disbanding = ref(false)
async function doDisband() {
  if (!selected.value || disbanding.value) return
  disbanding.value = true
  try {
    await data.deleteGroup(selected.value.id)
    selectedId.value = null
    confirmDisband.value = false
  } finally {
    disbanding.value = false
  }
}
</script>

<template>
  <AppLayout>
    <!-- no permission -->
    <NoAccess v-if="!perms.canEdit('group-change', auth.role)"
                hint="此頁面只有操作功能，需要「可編輯」權限，請洽系統管理員" />

    <div v-else class="flex gap-5 h-full">
      <!-- ═══ LEFT: group list ═══ -->
      <div class="w-96 flex-shrink-0 flex flex-col gap-3">
        <div class="space-y-3">
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">組別異動</h2>
          <button class="btn-primary flex items-center gap-1.5 !py-1.5 !px-3" @click="startCreate">
            <FolderPlus class="w-4 h-4" /> 新增組別
          </button>
        </div>

        <!-- Search (large) -->
        <div class="relative">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 pointer-events-none dark:text-slate-400" />
          <input
            v-model="search"
            type="text"
            placeholder="搜尋題目 / 老師 / 學生 / 學號…"
            class="input !pl-12 !pr-10 !py-3.5 !text-base !cursor-text"
          />
          <button
            v-if="search"
            @click="search = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center
                   rounded text-slate-600 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer dark:text-slate-400"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- filters: 學年 + 老師 -->
        <div class="grid grid-cols-2 gap-2">
          <select v-model="filterYear" class="input text-xs">
            <option value="">學年（全部）</option>
            <option v-for="y in years" :key="y" :value="y">{{ rocYear(y) }} 學年</option>
          </select>
          <select v-model="filterTeacher" class="input text-xs">
            <option value="">老師（全部）</option>
            <option v-for="t in data.teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>

        <!-- prompt before any criteria entered -->
        <div v-if="!hasCriteria" class="flex flex-col items-center justify-center flex-1 gap-2 text-center text-slate-600 dark:text-slate-400">
          <Search class="w-7 h-7 text-slate-300 dark:text-slate-400" />
          <p class="text-xs">輸入搜尋或選擇學年 / 老師<br>以顯示組別</p>
        </div>

        <template v-else>
          <p class="text-[11px] text-slate-600 px-1 dark:text-slate-400">
            搜尋到 {{ filteredGroups.length }} 筆結果<span v-if="filteredGroups.length > RESULT_LIMIT">，只顯示前 {{ RESULT_LIMIT }} 筆</span>
          </p>

          <div class="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-1">
            <button
              v-for="g in limitedGroups"
              :key="g.id"
              @click="selectGroup(g.id)"
              class="text-left rounded-lg border px-3 py-2.5 transition-colors cursor-pointer"
              :class="selectedId === g.id
                ? 'border-blue-400 dark:border-cyan-500/60 bg-blue-50 dark:bg-cyan-400/5'
                : 'border-slate-200 dark:border-[#2a3347] hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#1e2535]'"
            >
              <div class="flex items-center justify-between">
                <span class="id-mono">第 {{ String(g.number).padStart(2, ' ') }} 組</span>
                <span class="text-[10px] text-slate-600 dark:text-slate-400">{{ rocYear(g.school_year) }} 學年</span>
              </div>
              <p class="text-sm font-medium text-slate-800 dark:text-slate-100 truncate mt-0.5">{{ g.name }}</p>
              <p class="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                {{ g.teacher_ids.map(teacherName).join('、') || '未指定老師' }}
              </p>
              <p class="text-xs truncate mt-0.5">
                <span class="text-slate-600 dark:text-slate-400">組員：</span><template
                  v-if="members(g.id).length"
                ><template v-for="(m, i) in members(g.id)" :key="m.id"><span :class="m.id === g.leader_id ? 'text-amber-800 dark:text-amber-400 font-semibold' : 'text-slate-600 dark:text-slate-400'">{{ m.name }}</span><span v-if="i < members(g.id).length - 1" class="text-slate-600 dark:text-slate-400">、</span></template></template><span
                  v-else
                  class="text-slate-600 dark:text-slate-400"
                >無組員</span>
              </p>
            </button>
            <p v-if="filteredGroups.length === 0" class="text-center text-xs text-slate-600 py-8 dark:text-slate-400">
              找不到符合條件的組別
            </p>
          </div>
        </template>
      </div>

      <!-- ═══ RIGHT: edit / create panel ═══ -->
      <div class="flex-1 min-w-0">
        <!-- CREATE form -->
        <div v-if="isCreating" class="card overflow-hidden">
          <div class="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-[#2a3347]">
            <FolderPlus class="w-4 h-4 text-blue-700 dark:text-cyan-400" />
            <h3 class="font-semibold text-sm text-slate-700 dark:text-slate-200">新增組別</h3>
          </div>

          <div class="divide-y divide-slate-100 dark:divide-[#2a3347]">
            <div class="px-5 py-3.5 grid grid-cols-[7rem_1fr] items-center gap-4">
              <label class="text-sm text-slate-600 dark:text-slate-400">學年度 <span class="text-red-700 dark:text-red-400">*</span></label>
              <input v-model="createForm.school_year" list="gc-create-years" class="input" placeholder="114" />
              <datalist id="gc-create-years"><option v-for="y in years" :key="y" :value="y" /></datalist>
            </div>
            <div class="px-5 py-3.5 grid grid-cols-[7rem_1fr] items-center gap-4">
              <label class="text-sm text-slate-600 dark:text-slate-400">組號 <span class="text-red-700 dark:text-red-400">*</span></label>
              <input v-model.number="createForm.number" type="number" min="1" class="input" placeholder="1" />
            </div>
            <div class="px-5 py-3.5 grid grid-cols-[7rem_1fr] items-center gap-4">
              <label class="text-sm text-slate-600 dark:text-slate-400">專題名稱 <span class="text-red-700 dark:text-red-400">*</span></label>
              <input v-model="createForm.name" class="input" placeholder="請輸入專題名稱" />
            </div>
            <div class="px-5 py-3.5 grid grid-cols-[7rem_1fr] items-center gap-4">
              <label class="text-sm text-slate-600 dark:text-slate-400">專題類別</label>
              <div>
                <input v-model="createForm.category" list="gc-categories" class="input" placeholder="例如：資訊系統" />
                <datalist id="gc-categories"><option v-for="c in categories" :key="c" :value="c" /></datalist>
              </div>
            </div>
            <div class="px-5 py-3.5 grid grid-cols-[7rem_1fr] gap-4">
              <label class="text-sm text-slate-600 dark:text-slate-400 pt-1.5">指導老師</label>
              <div>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="t in data.teachers"
                    :key="t.id"
                    type="button"
                    @click="toggleCreateTeacher(t.id)"
                    class="px-3 py-1.5 rounded-lg text-sm border transition-colors cursor-pointer"
                    :class="createForm.teacher_ids.includes(t.id)
                      ? 'bg-blue-50 dark:bg-cyan-900/20 text-blue-700 dark:text-cyan-400 border-blue-300 dark:border-cyan-700 font-medium'
                      : 'border-slate-200 dark:border-[#2a3347] text-slate-600 dark:text-slate-400 hover:border-slate-300'"
                  >{{ t.name }}</button>
                  <span v-if="data.teachers.length === 0" class="text-sm text-slate-600 dark:text-slate-400">尚無老師，請先到「資料管理」新增</span>
                </div>
                <p class="text-xs text-slate-600 mt-2 dark:text-slate-400">點選老師以加入 / 移除，可指定多位。</p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-[#2a3347]
                      bg-slate-50/60 dark:bg-[#161b27]/50">
            <p v-if="createError" class="text-xs text-red-700 dark:text-red-400">{{ createError }}</p>
            <button class="btn-secondary ml-auto" @click="cancelCreate">取消</button>
            <button class="btn-primary flex items-center gap-1.5" :disabled="creating" @click="submitCreate">
              <FolderPlus class="w-4 h-4" /> {{ creating ? '建立中…' : '建立組別' }}
            </button>
          </div>
        </div>

        <!-- empty -->
        <div v-else-if="!selected"
             class="h-full flex flex-col items-center justify-center gap-3 border border-dashed
                    border-slate-200 dark:border-slate-700 rounded-xl text-center">
          <Users class="w-8 h-8 text-slate-300 dark:text-slate-400" />
          <p class="text-sm text-slate-600 dark:text-slate-400">從左側選擇一個組別，或點「新增組別」</p>
        </div>

        <!-- EDIT -->
        <div v-else class="flex flex-col gap-4">
          <!-- group header -->
          <div class="card p-5">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="id-mono">第 {{ selected.number }} 組</span>
                  <span class="text-xs text-slate-600 dark:text-slate-400">{{ rocYear(selected.school_year) }} 學年</span>
                </div>
                <p class="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{{ selected.name }}</p>
              </div>
              <div class="text-right text-xs text-slate-600 flex items-center gap-1 dark:text-slate-400">
                <Users class="w-3.5 h-3.5" /> {{ members(selected.id).length }} 位組員
              </div>
            </div>
          </div>

          <!-- members (wide detailed cards) -->
          <div class="card p-5">
            <div class="flex items-center gap-2 mb-3">
              <Users class="w-4 h-4 text-blue-700 dark:text-cyan-400" />
              <h3 class="font-semibold text-sm text-slate-700 dark:text-slate-200">組員資訊</h3>
              <span class="text-xs text-slate-600 dark:text-slate-400">共 {{ members(selected.id).length }} 位</span>
            </div>

            <div v-if="members(selected.id).length" class="flex flex-col gap-2.5">
              <div
                v-for="m in members(selected.id)"
                :key="m.id"
                class="flex items-center gap-4 w-full rounded-xl border px-4 py-3
                       border-slate-200 dark:border-[#2a3347] bg-slate-50/60 dark:bg-[#161b27]"
              >
                <!-- avatar -->
                <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
                     :class="m.status === 'inactive'
                       ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                       : 'bg-blue-100 dark:bg-cyan-900/25 text-blue-700 dark:text-cyan-300'">
                  {{ m.name[0] }}
                </div>

                <!-- info -->
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-base font-semibold text-slate-800 dark:text-slate-100"><StudentName :student="m" /></span>
                    <span v-if="m.id === selected.leader_id"
                          class="text-[10px] px-1.5 py-0.5 rounded font-medium
                                 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400
                                 border border-amber-200 dark:border-amber-700/40">★ 組長</span>
                  </div>
                  <div class="flex items-center gap-x-3 gap-y-0.5 flex-wrap mt-1 text-xs text-slate-600 dark:text-slate-400">
                    <span class="id-mono">{{ m.student_id }}</span>
                    <span>{{ yearClass(m.school_year, m.class_) }}</span>
                  </div>
                </div>

                <!-- status: only flag 休退學 -->
                <div v-if="m.status === 'inactive'" class="flex-shrink-0">
                  <span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md
                               bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400
                               border border-amber-200 dark:border-amber-700/40">休退學</span>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-slate-600 py-4 text-center dark:text-slate-400">此組目前沒有組員</p>
          </div>

          <!-- edit form (formal) -->
          <div class="card overflow-hidden">
            <!-- header -->
            <div class="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-[#2a3347]">
              <FileText class="w-4 h-4 text-blue-700 dark:text-cyan-400" />
              <h3 class="font-semibold text-sm text-slate-700 dark:text-slate-200">組別資料編輯</h3>
            </div>

            <!-- field rows -->
            <div class="divide-y divide-slate-100 dark:divide-[#2a3347]">
              <!-- 學年度 (read-only) -->
              <div class="px-5 py-3.5 grid grid-cols-[7rem_1fr] items-center gap-4">
                <span class="text-sm text-slate-600 dark:text-slate-400">學年度</span>
                <span class="text-sm text-slate-700 dark:text-slate-200">{{ rocYear(selected.school_year) }} 學年</span>
              </div>

              <!-- 組號 (read-only) -->
              <div class="px-5 py-3.5 grid grid-cols-[7rem_1fr] items-center gap-4">
                <span class="text-sm text-slate-600 dark:text-slate-400">組號</span>
                <span class="text-sm text-slate-700 dark:text-slate-200">第 {{ selected.number }} 組</span>
              </div>

              <!-- 專題名稱 -->
              <div class="px-5 py-3.5 grid grid-cols-[7rem_1fr] items-center gap-4">
                <label class="text-sm text-slate-600 dark:text-slate-400">
                  專題名稱 <span class="text-red-700 dark:text-red-400">*</span>
                </label>
                <input v-model="editName" class="input" placeholder="請輸入專題名稱" />
              </div>

              <!-- 專題類別 -->
              <div class="px-5 py-3.5 grid grid-cols-[7rem_1fr] items-center gap-4">
                <label class="text-sm text-slate-600 dark:text-slate-400">專題類別</label>
                <div>
                  <input v-model="editCategory" list="gc-categories" class="input" placeholder="例如：資訊系統" />
                  <datalist id="gc-categories"><option v-for="c in categories" :key="c" :value="c" /></datalist>
                </div>
              </div>

              <!-- 指導老師 -->
              <div class="px-5 py-3.5 grid grid-cols-[7rem_1fr] gap-4">
                <label class="text-sm text-slate-600 dark:text-slate-400 pt-1.5">指導老師</label>
                <div>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="t in data.teachers"
                      :key="t.id"
                      type="button"
                      @click="toggleTeacher(t.id)"
                      class="px-3 py-1.5 rounded-lg text-sm border transition-colors cursor-pointer"
                      :class="teacherIds.includes(t.id)
                        ? 'bg-blue-50 dark:bg-cyan-900/20 text-blue-700 dark:text-cyan-400 border-blue-300 dark:border-cyan-700 font-medium'
                        : 'border-slate-200 dark:border-[#2a3347] text-slate-600 dark:text-slate-400 hover:border-slate-300'"
                    >{{ t.name }}</button>
                    <span v-if="data.teachers.length === 0" class="text-sm text-slate-600 dark:text-slate-400">尚無老師，請先到「資料管理」新增</span>
                  </div>
                  <p class="text-xs text-slate-600 mt-2 dark:text-slate-400">點選老師以加入 / 移除，可指定多位。</p>
                </div>
              </div>
            </div>

            <!-- footer action bar -->
            <div class="flex items-center gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-[#2a3347]
                        bg-slate-50/60 dark:bg-[#161b27]/50">
              <p v-if="editError" class="text-xs text-red-700 dark:text-red-400">{{ editError }}</p>
              <Transition enter-active-class="transition" enter-from-class="opacity-0" leave-active-class="transition" leave-to-class="opacity-0">
                <span v-if="savedFlash" class="flex items-center gap-1 text-xs text-emerald-800 dark:text-emerald-400">
                  <Check class="w-3.5 h-3.5" />已儲存
                </span>
              </Transition>
              <span v-if="dirty && !savedFlash" class="text-xs text-amber-800 dark:text-amber-400">尚有未儲存的變更</span>
              <button class="btn-primary flex items-center gap-1.5 ml-auto" :disabled="!dirty || saving" @click="saveChanges">
                <Save class="w-4 h-4" /> {{ saving ? '儲存中…' : '儲存變更' }}
              </button>
            </div>
          </div>

          <!-- danger zone: disband -->
          <div class="card p-5 border-red-200 dark:!border-red-900/40">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h3 class="font-semibold text-sm text-red-700 dark:text-red-400">解散組別</h3>
                <p class="text-xs text-slate-600 mt-0.5 dark:text-slate-400">
                  刪除此組別，組員將變為未分組（資料保留）。此操作無法復原。
                </p>
              </div>
              <button class="btn-danger flex items-center gap-1.5 whitespace-nowrap" @click="confirmDisband = true">
                <Trash2 class="w-4 h-4" /> 解散組別
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- disband confirm -->
    <Transition enter-active-class="transition" enter-from-class="opacity-0" leave-active-class="transition" leave-to-class="opacity-0">
      <div v-if="confirmDisband" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
           @mousedown.self="confirmDisband = false">
        <div class="card w-80 mx-4 p-6 flex flex-col gap-4">
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
              <Trash2 class="w-4 h-4 text-red-700 dark:text-red-400" />
            </div>
            <div>
              <p class="font-semibold text-slate-800 dark:text-slate-100 text-sm">確認解散組別？</p>
              <p class="text-xs text-slate-600 mt-1 dark:text-slate-400">
                「第 {{ selected?.number }} 組 — {{ selected?.name }}」將被刪除，{{ members(selected?.id).length }} 位組員會變未分組。
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn-secondary" @click="confirmDisband = false">取消</button>
            <button class="btn-danger" :disabled="disbanding" @click="doDisband">
              {{ disbanding ? '處理中…' : '確認解散' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </AppLayout>
</template>
