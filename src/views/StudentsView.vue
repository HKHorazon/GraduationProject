<script setup>
import { ref, computed } from 'vue'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-vue-next'
import AppLayout from '@/components/layout/AppLayout.vue'
import { students } from '@/data/students'
import { groups } from '@/data/groups'
import { teachers } from '@/data/teachers'

// ROC year helper
function toRoc(schoolYear) {
  const y = parseInt(schoolYear.split('-')[0]) - 1911
  return `${y} 學年`
}

// Data helpers
function getGroup(group_id) {
  return groups.find(g => g.id === group_id) ?? null
}
function getTeacherNames(group_id) {
  const g = getGroup(group_id)
  if (!g) return '—'
  return g.teacher_ids.map(tid => teachers.find(t => t.id === tid)?.name ?? tid).join('、')
}

// Filters
const search = ref('')
const filterYear = ref('')
const filterTeacher = ref('')
const filterCategory = ref('')
const filterGrouped = ref('')

const years = [...new Set(students.map(s => s.school_year))].sort().reverse()
const allTeachers = teachers.map(t => t.name)
const allCategories = [...new Set(groups.map(g => g.category))]

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

// Filtered + sorted
const filtered = computed(() => {
  let result = students.filter(s => {
    const g = getGroup(s.group_id)
    if (filterYear.value && s.school_year !== filterYear.value) return false
    if (filterTeacher.value) {
      const names = g?.teacher_ids.map(tid => teachers.find(t => t.id === tid)?.name) ?? []
      if (!names.includes(filterTeacher.value)) return false
    }
    if (filterCategory.value && g?.category !== filterCategory.value) return false
    if (filterGrouped.value === 'grouped' && !s.group_id) return false
    if (filterGrouped.value === 'ungrouped' && s.group_id) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      return s.name.toLowerCase().includes(q)
        || s.student_id.toLowerCase().includes(q)
        || (getGroup(s.group_id)?.name ?? '').toLowerCase().includes(q)
    }
    return true
  })

  result = [...result].sort((a, b) => {
    let av, bv
    switch (sortCol.value) {
      case 'school_year': av = a.school_year; bv = b.school_year; break
      case 'student_id':  av = a.student_id;  bv = b.student_id;  break
      case 'name':        av = a.name;         bv = b.name;         break
      case 'group':       av = getGroup(a.group_id)?.number ?? 999; bv = getGroup(b.group_id)?.number ?? 999; break
      case 'teacher':     av = getTeacherNames(a.group_id); bv = getTeacherNames(b.group_id); break
      case 'category':    av = getGroup(a.group_id)?.category ?? ''; bv = getGroup(b.group_id)?.category ?? ''; break
      case 'project':     av = getGroup(a.group_id)?.name ?? ''; bv = getGroup(b.group_id)?.name ?? ''; break
      default: return 0
    }
    if (av < bv) return sortDir.value === 'asc' ? -1 : 1
    if (av > bv) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })

  return result
})

const cols = [
  { key: 'school_year', label: '學年度' },
  { key: 'student_id',  label: '學號' },
  { key: 'name',        label: '姓名' },
  { key: 'group',       label: '組別' },
  { key: 'teacher',     label: '老師' },
  { key: 'category',    label: '專題類別' },
  { key: 'project',     label: '專題名稱' },
]
</script>

<template>
  <AppLayout>
    <div class="space-y-4">
      <!-- Header + Filters -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">學生列表</h2>
            <p class="text-xs text-slate-500 mt-0.5">共 {{ filtered.length }} 位學生</p>
          </div>
        </div>
        <div class="flex gap-2 flex-wrap">
          <input v-model="search" class="input w-48 text-xs" placeholder="搜尋姓名 / 學號 / 專題…" />
          <select v-model="filterYear" class="input w-36 text-xs">
            <option value="">學年（全部）</option>
            <option v-for="y in years" :key="y" :value="y">{{ toRoc(y) }}</option>
          </select>
          <select v-model="filterTeacher" class="input w-32 text-xs">
            <option value="">老師（全部）</option>
            <option v-for="t in allTeachers" :key="t" :value="t">{{ t }}</option>
          </select>
          <select v-model="filterCategory" class="input w-36 text-xs">
            <option value="">專題類別（全部）</option>
            <option v-for="c in allCategories" :key="c" :value="c">{{ c }}</option>
          </select>
          <select v-model="filterGrouped" class="input w-36 text-xs">
            <option value="">分組狀態（全部）</option>
            <option value="grouped">已分組</option>
            <option value="ungrouped">未分組</option>
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
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-[#2a3347]">
              <tr
                v-for="s in filtered"
                :key="s.id"
                class="hover:bg-slate-50 dark:hover:bg-[#2a3347]/20 transition-colors"
              >
                <td class="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{{ toRoc(s.school_year) }}</td>
                <td class="px-4 py-3 id-mono">{{ s.student_id }}</td>
                <td class="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{{ s.name }}</td>
                <td class="px-4 py-3">
                  <span v-if="s.group_id" class="flex items-center gap-1">
                    <span
                      class="px-2 py-0.5 rounded-full text-xs font-medium
                             bg-blue-50 dark:bg-cyan-900/20
                             text-blue-700 dark:text-cyan-400
                             border border-blue-200 dark:border-cyan-800/50">
                      第 {{ getGroup(s.group_id)?.number }} 組
                    </span>
                    <span
                      v-if="getGroup(s.group_id)?.leader_id === s.id"
                      class="px-1.5 py-0.5 rounded text-xs font-medium
                             bg-amber-50 dark:bg-amber-900/20
                             text-amber-600 dark:text-amber-400
                             border border-amber-200 dark:border-amber-700/40"
                      title="組長"
                    >★ 組長</span>
                  </span>
                  <span v-else class="text-slate-400 dark:text-slate-600 text-xs">未分組</span>
                </td>
                <td class="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">{{ getTeacherNames(s.group_id) }}</td>
                <td class="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">{{ getGroup(s.group_id)?.category ?? '—' }}</td>
                <td class="px-4 py-3 text-slate-700 dark:text-slate-300 text-xs">{{ getGroup(s.group_id)?.name ?? '—' }}</td>
              </tr>
              <tr v-if="filtered.length === 0">
                <td colspan="7" class="px-4 py-10 text-center text-slate-400 dark:text-slate-600 text-sm">
                  找不到符合條件的學生
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-4 py-2 text-xs text-slate-400 dark:text-slate-600 border-t border-slate-100 dark:border-[#2a3347]">
          顯示 {{ filtered.length }} / {{ students.length }} 筆
        </div>
      </div>
    </div>
  </AppLayout>
</template>
