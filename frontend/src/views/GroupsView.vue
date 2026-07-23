<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { ChevronUp, ChevronDown, ChevronsUpDown, Pencil } from 'lucide-vue-next'
import AppLayout from '@/components/layout/AppLayout.vue'
import TableActionMenu from '@/components/TableActionMenu.vue'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import { rocYear } from '@/lib/year'
import StudentName from '@/components/common/StudentName.vue'
import GroupName from '@/components/common/GroupName.vue'

const auth = useAuthStore()
const data = useDataStore()

onMounted(() => { data.loadAll() })

function toRoc(schoolYear) {
  return `${rocYear(schoolYear)} 學年`
}

// Filters
const filterYear = ref('')
const filterTeacher = ref('')

const years = computed(() => [...new Set(data.groups.map(g => g.school_year))].sort().reverse())
const allTeachers = computed(() => data.teachers.map(t => ({ id: t.id, name: t.name })))

// Sort
const sortCol = ref('school_year')
const sortDir = ref('desc')

function toggleSort(col) {
  if (sortCol.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortCol.value = col
    sortDir.value = 'asc'
  }
}

function members(groupId) {
  const g = data.groups.find(x => x.id === groupId)
  const leaderId = g?.leader_id
  // leader first, rest keep their existing order
  return data.students
    .filter(s => s.group_id === groupId)
    .sort((a, b) => (a.id === leaderId ? -1 : 0) - (b.id === leaderId ? -1 : 0))
}

function teacherNames(g) {
  return g.teacher_ids.map(tid => data.teachers.find(t => t.id === tid)?.name ?? tid).join('、')
}

const filteredGroups = computed(() => {
  let list = [...data.groups]
  if (filterYear.value) list = list.filter(g => g.school_year === filterYear.value)
  if (filterTeacher.value) list = list.filter(g => g.teacher_ids.includes(filterTeacher.value))

  return list.sort((a, b) => {
    let av, bv
    switch (sortCol.value) {
      case 'school_year': av = a.school_year;   bv = b.school_year;   break
      case 'number':      av = a.number;         bv = b.number;         break
      case 'name':        av = a.name;           bv = b.name;           break
      case 'category':    av = a.category;       bv = b.category;       break
      case 'teacher':     av = teacherNames(a);  bv = teacherNames(b);  break
      case 'members':     av = members(a.id).length; bv = members(b.id).length; break
      default: return 0
    }
    if (av < bv) return sortDir.value === 'asc' ? -1 : 1
    if (av > bv) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })
})

const cols = [
  { key: 'school_year', label: '學年度' },
  { key: 'number',      label: '組號' },
  { key: 'name',        label: '專題名稱' },
  { key: 'category',    label: '類別' },
  { key: 'teacher',     label: '指導老師' },
  { key: 'members',     label: '組員' },
]

// Edit group name modal
const editingGroup = ref(null)
const editName = ref('')
const editNameInput = ref(null)
const saving = ref(false)
const saveError = ref('')

watch(editingGroup, (val) => {
  if (val) nextTick(() => editNameInput.value?.focus())
})

function openEditName(g) {
  editingGroup.value = g
  editName.value = g.name
  saveError.value = ''
}

async function saveEditName() {
  if (!editingGroup.value || !editName.value.trim() || saving.value) return
  saving.value = true
  saveError.value = ''
  try {
    await data.updateGroup(editingGroup.value.id, { name: editName.value.trim() })
    editingGroup.value = null
  } catch (e) {
    saveError.value = e.message ?? '儲存失敗'
  } finally {
    saving.value = false
  }
}

function groupActions(g) {
  return [
    {
      label: '修改主題/名稱',
      icon: Pencil,
      handler: () => openEditName(g),
    },
  ]
}
</script>

<template>
  <AppLayout>
    <div class="space-y-4">
      <!-- Header + Filters -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">組別列表</h2>
            <p class="text-xs text-slate-500 mt-0.5">共 {{ filteredGroups.length }} 個組別</p>
          </div>
        </div>
        <div class="flex gap-2 flex-wrap">
          <select v-model="filterYear" class="input w-36 text-xs">
            <option value="">學年（全部）</option>
            <option v-for="y in years" :key="y" :value="y">{{ toRoc(y) }}</option>
          </select>
          <select v-model="filterTeacher" class="input w-32 text-xs">
            <option value="">老師（全部）</option>
            <option v-for="t in allTeachers" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="border-b border-slate-100 dark:border-[#2a3347]">
              <tr>
                <th
                  v-for="col in cols"
                  :key="col.key"
                  class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider
                         text-slate-500 dark:text-slate-400
                         hover:text-slate-700 dark:hover:text-slate-200
                         select-none cursor-pointer transition-colors"
                  @click="toggleSort(col.key)"
                >
                  <div class="flex items-center gap-1">
                    {{ col.label }}
                    <ChevronUp v-if="sortCol === col.key && sortDir === 'asc'" class="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                    <ChevronDown v-else-if="sortCol === col.key && sortDir === 'desc'" class="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                    <ChevronsUpDown v-else class="w-3 h-3 opacity-30" />
                  </div>
                </th>
                <th v-if="auth.isEditor" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                  管理
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-[#2a3347]">
              <tr
                v-for="g in filteredGroups"
                :key="g.id"
                class="hover:bg-slate-50 dark:hover:bg-[#2a3347]/20 transition-colors"
              >
                <td class="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{{ toRoc(g.school_year) }}</td>
                <td class="px-3 py-2.5 id-mono text-xs whitespace-nowrap"><GroupName :group="g" :label="`第 ${String(g.number).padStart(2, ' ')} 組`" /></td>
                <td class="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-100 text-sm"><GroupName :group="g" /></td>
                <td class="px-3 py-2.5 whitespace-nowrap">
                  <span class="px-1.5 py-0.5 rounded text-xs
                               bg-slate-100 dark:bg-[#2a3347]
                               text-slate-600 dark:text-slate-300">
                    {{ g.category }}
                  </span>
                </td>
                <td class="px-3 py-2.5 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">{{ teacherNames(g) }}</td>
                <td class="px-3 py-2.5">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="s in members(g.id)"
                      :key="s.id"
                      class="px-1.5 py-0.5 rounded text-xs border"
                      :class="s.id === g.leader_id
                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700/40 font-medium'
                        : 'bg-blue-50 dark:bg-cyan-900/20 text-blue-700 dark:text-cyan-400 border-blue-100 dark:border-cyan-800/30'"
                    ><StudentName :student="s" /></span>
                    <span v-if="members(g.id).length === 0" class="text-slate-400 dark:text-slate-600 text-xs">—</span>
                  </div>
                </td>
                <td v-if="auth.isEditor" class="px-4 py-2.5">
                  <TableActionMenu :actions="groupActions(g)" />
                </td>
              </tr>
              <tr v-if="filteredGroups.length === 0">
                <td :colspan="auth.isEditor ? 7 : 6" class="px-4 py-10 text-center text-slate-400 dark:text-slate-600 text-sm">
                  找不到符合條件的組別
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-4 py-2 text-xs text-slate-400 dark:text-slate-600 border-t border-slate-100 dark:border-[#2a3347]">
          顯示 {{ filteredGroups.length }} / {{ data.groups.length }} 筆
        </div>
      </div>
    </div>
    <!-- Edit name modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-150 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-all duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="editingGroup"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60"
          @mousedown.self="editingGroup = null"
        >
          <div class="w-full max-w-md mx-4 rounded-xl shadow-xl
                      bg-white dark:bg-[#1a2235]
                      border border-slate-200 dark:border-[#2a3347]">
            <div class="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-[#2a3347]">
              <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                修改主題/名稱 — 第 {{ editingGroup.number }} 組
              </span>
            </div>
            <form @submit.prevent="saveEditName" class="p-5 space-y-4">
              <div class="space-y-1">
                <label class="text-xs text-slate-500 dark:text-slate-400">專題名稱</label>
                <input
                  ref="editNameInput"
                  v-model="editName"
                  type="text"
                  class="input w-full text-sm"
                  placeholder="請輸入新的專題名稱"
                />
              </div>
              <p v-if="saveError" class="text-xs text-red-500 dark:text-red-400">{{ saveError }}</p>
              <div class="flex gap-2 justify-end">
                <button
                  type="button"
                  @click="editingGroup = null"
                  class="px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer
                         bg-slate-100 dark:bg-[#2a3347]
                         text-slate-600 dark:text-slate-300
                         hover:bg-slate-200 dark:hover:bg-[#323d54]"
                >取消</button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer
                         bg-blue-600 dark:bg-cyan-500 text-white
                         hover:bg-blue-700 dark:hover:bg-cyan-400 disabled:opacity-50"
                >{{ saving ? '儲存中…' : '儲存' }}</button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>
