<script setup>
import { ref, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { groups } from '@/data/groups'
import { students } from '@/data/students'

function toRoc(schoolYear) {
  const y = parseInt(schoolYear.split('-')[0]) - 1911
  return `${y} 學年`
}

const selectedGroupId = ref('')
const selectedStudentId = ref('')
const successMsg = ref('')

const selectedGroup = computed(() => groups.find(g => g.id === selectedGroupId.value))
const groupMembers = computed(() => students.filter(s => s.group_id === selectedGroupId.value))
const selectedStudent = computed(() => students.find(s => s.id === selectedStudentId.value))

function confirmRemove() {
  const student = selectedStudent.value
  if (!student) return
  student.group_id = null
  successMsg.value = `已將 ${student.name} 從第${selectedGroup.value.number}組移除`
  selectedStudentId.value = ''
  setTimeout(() => { successMsg.value = '' }, 3000)
}
</script>

<template>
  <AppLayout>
    <div class="max-w-lg space-y-6">
      <div>
        <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">移除學生出組</h2>
        <p class="text-xs text-slate-500 mt-0.5">從組別中移除學生，學生將變為未分組狀態</p>
      </div>

      <!-- Step 1 -->
      <div class="card p-4 space-y-3">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">① 選擇組別</p>
        <select v-model="selectedGroupId" class="input text-sm" @change="selectedStudentId = ''">
          <option value="">-- 請選擇組別 --</option>
          <option v-for="g in groups" :key="g.id" :value="g.id">
            {{ toRoc(g.school_year) }} 第{{ g.number }}組 — {{ g.name }}
          </option>
        </select>
      </div>

      <!-- Step 2 -->
      <div v-if="selectedGroupId" class="card p-4 space-y-3">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">② 選擇學生</p>
        <div v-if="groupMembers.length === 0" class="text-slate-500 text-sm">此組別目前沒有學生</div>
        <div v-else class="flex flex-col gap-1">
          <label
            v-for="s in groupMembers"
            :key="s.id"
            class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors"
            :class="selectedStudentId === s.id
              ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30'
              : 'hover:bg-slate-50 dark:hover:bg-[#2a3347]/30'"
          >
            <input type="radio" :value="s.id" v-model="selectedStudentId" class="accent-red-500" />
            <span class="text-slate-800 dark:text-slate-200 text-sm font-medium">{{ s.name }}</span>
            <span class="id-mono">{{ s.student_id }}</span>
            <span class="text-slate-400 text-xs ml-auto">{{ s.class }}</span>
          </label>
        </div>
      </div>

      <!-- Step 3 -->
      <div v-if="selectedStudent" class="card p-4 space-y-4 border-red-200 dark:border-red-500/20">
        <p class="text-xs font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">③ 確認移除</p>
        <div class="bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300">
          確定將 <span class="text-red-600 dark:text-red-400 font-semibold">{{ selectedStudent.name }}</span> 從
          <span class="text-blue-600 dark:text-cyan-400 font-semibold">第{{ selectedGroup.number }}組</span> 移除？
          <br><span class="text-slate-400 text-xs mt-1 block">移除後學生將變為未分組狀態。</span>
        </div>
        <button @click="confirmRemove" class="btn-danger w-full">確認移除</button>
      </div>

      <!-- Success -->
      <div v-if="successMsg"
        class="bg-blue-50 dark:bg-cyan-900/20 border border-blue-200 dark:border-cyan-800/30 rounded-lg px-4 py-3 text-blue-700 dark:text-cyan-400 text-sm">
        ✓ {{ successMsg }}
      </div>
    </div>
  </AppLayout>
</template>
