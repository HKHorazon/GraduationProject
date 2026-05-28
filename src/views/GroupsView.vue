<script setup>
import { ref, computed } from 'vue'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-vue-next'
import AppLayout from '@/components/layout/AppLayout.vue'
import { groups } from '@/data/groups'
import { students } from '@/data/students'
import { teachers } from '@/data/teachers'

function toRoc(schoolYear) {
  const y = parseInt(schoolYear.split('-')[0]) - 1911
  return `${y} 學年`
}

// Filters
const filterYear = ref('')
const filterTeacher = ref('')

const years = [...new Set(groups.map(g => g.school_year))].sort().reverse()
const allTeachers = teachers.map(t => ({ id: t.id, name: t.name }))

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

function memberCount(groupId) {
  return students.filter(s => s.group_id === groupId).length
}

function leaderName(g) {
  return students.find(s => s.id === g.leader_id)?.name ?? '—'
}

function teacherNames(g) {
  return g.teacher_ids.map(tid => teachers.find(t => t.id === tid)?.name ?? tid).join('、')
}

const filteredGroups = computed(() => {
  let list = [...groups]
  if (filterYear.value) list = list.filter(g => g.school_year === filterYear.value)
  if (filterTeacher.value) list = list.filter(g => g.teacher_ids.includes(filterTeacher.value))

  return list.sort((a, b) => {
    let av, bv
    switch (sortCol.value) {
      case 'school_year': av = a.school_year;           bv = b.school_year;           break
      case 'number':      av = a.number;                bv = b.number;                break
      case 'name':        av = a.name;                  bv = b.name;                  break
      case 'category':    av = a.category;              bv = b.category;              break
      case 'teacher':     av = teacherNames(a);         bv = teacherNames(b);         break
      case 'leader':      av = leaderName(a);           bv = leaderName(b);           break
      case 'count':       av = memberCount(a.id);       bv = memberCount(b.id);       break
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
  { key: 'category',    label: '專題類別' },
  { key: 'teacher',     label: '指導老師' },
  { key: 'leader',      label: '組長' },
  { key: 'count',       label: '人數' },
]
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
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-[#2a3347]">
              <tr
                v-for="g in filteredGroups"
                :key="g.id"
                class="hover:bg-slate-50 dark:hover:bg-[#2a3347]/20 transition-colors"
              >
                <td class="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{{ toRoc(g.school_year) }}</td>
                <td class="px-4 py-3 id-mono">第 {{ g.number }} 組</td>
                <td class="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{{ g.name }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded-full text-xs
                               bg-slate-100 dark:bg-[#2a3347]
                               text-slate-600 dark:text-slate-300">
                    {{ g.category }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">{{ teacherNames(g) }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded text-xs font-medium
                               bg-amber-50 dark:bg-amber-900/20
                               text-amber-600 dark:text-amber-400
                               border border-amber-200 dark:border-amber-700/40">
                    ★ {{ leaderName(g) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                  {{ memberCount(g.id) }} 人
                </td>
              </tr>
              <tr v-if="filteredGroups.length === 0">
                <td colspan="7" class="px-4 py-10 text-center text-slate-400 dark:text-slate-600 text-sm">
                  找不到符合條件的組別
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-4 py-2 text-xs text-slate-400 dark:text-slate-600 border-t border-slate-100 dark:border-[#2a3347]">
          顯示 {{ filteredGroups.length }} / {{ groups.length }} 筆
        </div>
      </div>
    </div>
  </AppLayout>
</template>
