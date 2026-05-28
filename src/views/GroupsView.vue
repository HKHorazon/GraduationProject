<script setup>
import { ref, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { groups } from '@/data/groups'
import { students } from '@/data/students'
import { teachers } from '@/data/teachers'

function toRoc(schoolYear) {
  const y = parseInt(schoolYear.split('-')[0]) - 1911
  return `${y} 學年`
}

const filterYear = ref('')
const filterTeacher = ref('')

const years = [...new Set(groups.map(g => g.school_year))].sort().reverse()
const allTeachers = teachers.map(t => ({ id: t.id, name: t.name }))

const filteredGroups = computed(() => {
  let list = [...groups]
  if (filterYear.value) list = list.filter(g => g.school_year === filterYear.value)
  if (filterTeacher.value) list = list.filter(g => g.teacher_ids.includes(filterTeacher.value))
  return list.sort((a, b) => b.school_year.localeCompare(a.school_year) || a.number - b.number)
})

function members(groupId) {
  return students.filter(s => s.group_id === groupId)
}
function teacherName(tid) {
  return teachers.find(t => t.id === tid)?.name ?? tid
}
</script>

<template>
  <AppLayout>
    <div class="space-y-4">
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

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="g in filteredGroups"
          :key="g.id"
          class="card p-4 space-y-3 hover:border-blue-200 dark:hover:border-cyan-800/50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="id-mono">第 {{ g.number }} 組</span>
                <span class="text-xs text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#2a3347]">{{ toRoc(g.school_year) }}</span>
                <span class="text-xs text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#2a3347]">{{ g.category }}</span>
              </div>
              <p class="text-slate-800 dark:text-slate-100 font-semibold mt-1">{{ g.name }}</p>
            </div>
          </div>

          <div class="space-y-1">
            <p class="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">指導老師</p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="tid in g.teacher_ids"
                :key="tid"
                class="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-[#2a3347] text-slate-600 dark:text-slate-300"
              >{{ teacherName(tid) }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <p class="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">組員（{{ members(g.id).length }} 人）</p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="s in members(g.id)"
                :key="s.id"
                class="flex items-center gap-1 px-2 py-0.5 rounded text-xs border"
                :class="s.id === g.leader_id
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/40 font-medium'
                  : 'bg-blue-50 dark:bg-cyan-900/20 text-blue-700 dark:text-cyan-400 border-blue-100 dark:border-cyan-800/30'"
              >
                <span v-if="s.id === g.leader_id" class="text-amber-500 dark:text-amber-400">★</span>
                {{ s.name }}
              </span>
              <span v-if="members(g.id).length === 0" class="text-slate-400 dark:text-slate-600 text-xs">尚無組員</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
