<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { GripVertical, Save, RotateCcw } from 'lucide-vue-next'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import { rocYear } from '@/lib/year'
import StudentName from '@/components/common/StudentName.vue'
import GroupName from '@/components/common/GroupName.vue'

const auth = useAuthStore()
const data = useDataStore()

onMounted(() => { data.loadAll() })

const filterYear = ref('')
const localOrder = ref([]) // group objects in the current (maybe unsaved) order

const years = computed(() =>
  [...new Set(data.groups.map((g) => g.school_year))].sort().reverse()
)

// default to newest year once data arrives
watch(years, (ys) => {
  if (!filterYear.value && ys.length) filterYear.value = ys[0]
})

function savedOrder() {
  return data.groups
    .filter((g) => g.school_year === filterYear.value)
    .sort((a, b) => a.number - b.number)
}
function resetOrder() {
  localOrder.value = savedOrder()
}
// re-sync whenever the year changes or the store's groups are replaced
watch([filterYear, () => data.groups], resetOrder, { immediate: true })

const dirty = computed(() => {
  const saved = savedOrder()
  return (
    localOrder.value.length !== saved.length ||
    localOrder.value.some((g, i) => g.id !== saved[i]?.id)
  )
})

// --- card data helpers (leader first) ---
function members(groupId, leaderId) {
  return data.students
    .filter((s) => s.group_id === groupId)
    .sort((a, b) => (a.id === leaderId ? -1 : 0) - (b.id === leaderId ? -1 : 0))
}
function teacherNames(g) {
  return g.teacher_ids
    .map((tid) => data.teachers.find((t) => t.id === tid)?.name ?? tid)
    .join('、')
}

// --- native HTML5 drag & drop, live reorder ---
// The list rearranges as you drag over each card, so groups physically slot
// into their new position (第 X 組 updates in real time) — no ghost/透明 effect.
const dragIndex = ref(-1)

function onDragStart(i) { dragIndex.value = i }
function onDragEnter(i) {
  if (dragIndex.value === -1 || dragIndex.value === i) return
  const arr = [...localOrder.value]
  const [moved] = arr.splice(dragIndex.value, 1)
  arr.splice(i, 0, moved)
  localOrder.value = arr
  dragIndex.value = i
}
function onDrop() { dragIndex.value = -1 }
function onDragEnd() { dragIndex.value = -1 }

// --- save ---
const saving = ref(false)
const saveError = ref('')

async function save() {
  if (!dirty.value || saving.value) return
  saving.value = true
  saveError.value = ''
  try {
    await data.reorderGroups(filterYear.value, localOrder.value.map((g) => g.id))
    resetOrder()
  } catch (e) {
    saveError.value = e.message ?? '儲存失敗'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="space-y-4">
      <!-- Header + year picker -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">組別排序</h2>
            <p class="text-xs text-slate-600 mt-0.5 dark:text-slate-400">
              拖拉卡片調整組別順序（第 X 組），完成後按儲存
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="auth.isEditor"
              type="button"
              class="btn-secondary text-xs flex items-center gap-1 disabled:opacity-40"
              :disabled="!dirty || saving"
              @click="resetOrder"
            >
              <RotateCcw class="w-3.5 h-3.5" /> 還原
            </button>
            <button
              v-if="auth.isEditor"
              type="button"
              class="btn-primary text-xs flex items-center gap-1 disabled:opacity-40"
              :disabled="!dirty || saving"
              @click="save"
            >
              <Save class="w-3.5 h-3.5" /> {{ saving ? '儲存中…' : '儲存順序' }}
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <select v-model="filterYear" class="input w-40 text-xs">
            <option v-for="y in years" :key="y" :value="y">{{ rocYear(y) }} 學年</option>
          </select>
          <span v-if="dirty" class="text-xs text-amber-800 dark:text-amber-400">尚未儲存</span>
          <span v-if="saveError" class="text-xs text-red-700 dark:text-red-400">{{ saveError }}</span>
        </div>
      </div>

      <p v-if="!auth.isEditor" class="text-xs text-slate-600 dark:text-slate-400">
        僅檢視模式 — 需編輯權限才能調整順序。
      </p>

      <!-- Draggable cards -->
      <div class="space-y-2">
        <div
          v-for="(g, i) in localOrder"
          :key="g.id"
          :draggable="auth.isEditor"
          class="card flex items-stretch gap-3 p-3 transition-shadow duration-100 select-none"
          :class="[
            auth.isEditor ? 'cursor-grab active:cursor-grabbing' : '',
            dragIndex === i
              ? 'shadow-lg ring-2 ring-blue-400 dark:ring-cyan-400 relative z-10'
              : '',
          ]"
          @dragstart="onDragStart(i)"
          @dragenter.prevent="onDragEnter(i)"
          @dragover.prevent
          @drop.prevent="onDrop"
          @dragend="onDragEnd"
        >
          <!-- handle + position -->
          <div class="flex items-center gap-2 flex-shrink-0 w-24">
            <GripVertical
              v-if="auth.isEditor"
              class="w-4 h-4 text-slate-600 dark:text-slate-400"
            />
            <span class="id-mono text-sm font-semibold text-slate-700 dark:text-slate-200">
              第 {{ i + 1 }} 組
            </span>
          </div>

          <!-- topic + category + teachers -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium text-slate-800 dark:text-slate-100 text-sm">
                <GroupName :group="g" />
              </span>
              <span
                v-if="g.category"
                class="px-1.5 py-0.5 rounded text-xs bg-slate-100 dark:bg-[#2a3347] text-slate-600 dark:text-slate-300"
              >{{ g.category }}</span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
              指導老師：{{ teacherNames(g) || '—' }}
            </p>
          </div>

          <!-- leader + members -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap gap-1">
              <span
                v-for="s in members(g.id, g.leader_id)"
                :key="s.id"
                class="px-1.5 py-0.5 rounded text-xs border"
                :class="s.id === g.leader_id
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-700/40 font-medium'
                  : 'bg-blue-50 dark:bg-cyan-900/20 text-blue-700 dark:text-cyan-400 border-blue-100 dark:border-cyan-800/30'"
              ><StudentName :student="s" /></span>
              <span
                v-if="members(g.id, g.leader_id).length === 0"
                class="text-slate-600 dark:text-slate-400 text-xs"
              >—</span>
            </div>
          </div>
        </div>

        <div
          v-if="localOrder.length === 0"
          class="card px-4 py-10 text-center text-slate-600 dark:text-slate-400 text-sm"
        >
          此學年沒有組別
        </div>
      </div>
    </div>
  </AppLayout>
</template>
