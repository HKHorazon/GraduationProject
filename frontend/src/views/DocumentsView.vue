<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import {
  FileText, FilePen, ChevronRight, ArrowLeft,
  CheckCircle, Loader2, ShieldOff,
} from 'lucide-vue-next'

const data = useDataStore()
const auth = useAuthStore()
onMounted(() => data.loadAll())

// ── Sidebar nav ───────────────────────────────────────────────────
const activeDoc = ref('form1') // 'form1' | 'form2'

// ── Shared helpers ────────────────────────────────────────────────
const years = computed(() =>
  [...new Set(data.students.map((s) => s.school_year).filter(Boolean))].sort().reverse()
)

const CLASS_OPTIONS = ['甲', '乙']

const CATEGORY_OPTIONS = ['主視覺', '多媒體', '遊戲', '網紅直播', '平面設計', '其他']

function findByStudentId(sid) {
  return data.students.find((s) => s.student_id === sid.trim()) ?? null
}

// ── Form 1 state ──────────────────────────────────────────────────
const f1 = ref({
  school_year: '',
  number: '',
  class_: '',
  teacher_id: '',
  title: '',
  category: '',
  leader_sid: '',
  members: ['', '', '', ''],
  note: '',
})

const leaderStudent = computed(() =>
  f1.value.leader_sid.trim() ? findByStudentId(f1.value.leader_sid) : null
)
const memberStudents = computed(() =>
  f1.value.members.map((sid) => (sid.trim() ? findByStudentId(sid) : null))
)

function leaderState() {
  if (!f1.value.leader_sid.trim()) return ''
  return leaderStudent.value ? 'ok' : 'err'
}
function memberState(i) {
  if (!f1.value.members[i].trim()) return ''
  return memberStudents.value[i] ? 'ok' : 'err'
}

const f1Step = ref('form') // 'form' | 'preview' | 'done'
const f1Error = ref('')
const f1Executing = ref(false)
const f1ExecError = ref('')

function validateF1() {
  if (!f1.value.school_year.trim()) return '請填寫學年度'
  if (!f1.value.number) return '請填寫組號'
  if (!f1.value.title.trim()) return '請填寫專題題目'
  if (!f1.value.category.trim()) return '請選擇類別'
  if (!f1.value.teacher_id) return '請選擇指導老師'
  if (!f1.value.leader_sid.trim()) return '請填寫組長學號'
  if (!leaderStudent.value) return `找不到學號「${f1.value.leader_sid}」的學生`
  for (let i = 0; i < f1.value.members.length; i++) {
    if (f1.value.members[i].trim() && !memberStudents.value[i]) {
      return `組員 ${i + 1}：找不到學號「${f1.value.members[i]}」的學生`
    }
  }
  return ''
}

function submitF1() {
  const err = validateF1()
  if (err) { f1Error.value = err; return }
  f1Error.value = ''
  f1Step.value = 'preview'
}

const previewOps = computed(() => {
  const teacher = data.teachers.find((t) => t.id === f1.value.teacher_id)
  const ops = [
    {
      icon: '✦',
      color: 'text-blue-600 dark:text-cyan-400',
      text: `建立新組別「${f1.value.title}」`,
      sub: `第 ${f1.value.number} 組・學年 ${f1.value.school_year}・指導老師：${teacher?.name ?? '—'}`,
    },
  ]
  if (leaderStudent.value) {
    ops.push({
      icon: '★',
      color: 'text-amber-500',
      text: `設定組長：${leaderStudent.value.name}（${leaderStudent.value.student_id}）`,
      sub: '加入本組並標記為組長',
    })
  }
  memberStudents.value.forEach((s) => {
    if (s) {
      ops.push({
        icon: '◆',
        color: 'text-slate-400',
        text: `加入組員：${s.name}（${s.student_id}）`,
        sub: '加入本組',
      })
    }
  })
  return ops
})

async function executeF1() {
  if (f1Executing.value) return
  f1Executing.value = true
  f1ExecError.value = ''
  try {
    const group = await data.createGroup({
      school_year: f1.value.school_year.trim(),
      number: Number(f1.value.number),
      name: f1.value.title.trim(),
      category: f1.value.category.trim() || null,
      leader_id: null,
      teacher_ids: [f1.value.teacher_id],
    })
    const allStudents = [leaderStudent.value, ...memberStudents.value.filter(Boolean)]
    for (const s of allStudents) {
      await data.updateStudent(s.id, { group_id: group.id })
    }
    if (leaderStudent.value) {
      await data.updateGroup(group.id, { leader_id: leaderStudent.value.id })
    }
    f1Step.value = 'done'
  } catch (e) {
    f1ExecError.value = e.message ?? '執行失敗，請重試'
  } finally {
    f1Executing.value = false
  }
}

function resetF1() {
  f1.value = {
    school_year: '', number: '', class_: '', teacher_id: '',
    title: '', category: '', leader_sid: '', members: ['', '', '', ''], note: '',
  }
  f1Error.value = ''
  f1ExecError.value = ''
  f1Step.value = 'form'
}
</script>

<template>
  <AppLayout>
    <!-- no permission -->
    <div v-if="!auth.isEditor"
         class="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#2a3347] flex items-center justify-center">
        <ShieldOff class="w-6 h-6 text-slate-400" />
      </div>
      <p class="font-semibold text-slate-700 dark:text-slate-300">無編輯權限</p>
      <p class="text-sm text-slate-400">此頁面僅限編輯者使用</p>
    </div>

    <div v-else class="flex gap-5 h-full">

      <!-- ═══ LEFT: doc sidebar ═══ -->
      <div class="w-44 flex-shrink-0 flex flex-col gap-1.5">
        <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2">
          文件專區
        </p>

        <button
          v-for="doc in [
            { key: 'form1', icon: FileText, label: '文件 1', sub: '同意書' },
            { key: 'form2', icon: FilePen,  label: '文件 2', sub: '更改表' },
          ]"
          :key="doc.key"
          @click="activeDoc = doc.key"
          class="flex items-center gap-2.5 px-3 py-3 rounded-lg text-left transition-colors cursor-pointer w-full"
          :class="activeDoc === doc.key
            ? 'bg-blue-50 dark:bg-cyan-900/15 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-800/40'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2a3347]'"
        >
          <component :is="doc.icon" class="w-4 h-4 flex-shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium leading-tight">{{ doc.label }}</p>
            <p class="text-[11px] opacity-60 truncate mt-0.5">{{ doc.sub }}</p>
          </div>
          <ChevronRight v-if="activeDoc === doc.key" class="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
        </button>
      </div>

      <!-- ═══ RIGHT: content ═══ -->
      <div class="flex-1 min-w-0 overflow-y-auto">

        <!-- ─── 文件1：同意書 ─────────────────────────────────────── -->
        <div v-if="activeDoc === 'form1'">

          <!-- STEP: form -->
          <div v-if="f1Step === 'form'" class="max-w-2xl">
            <div class="bg-white dark:bg-[#1e2535] border border-slate-300 dark:border-[#2a3347] rounded-xl overflow-hidden shadow-sm">

              <!-- header -->
              <div class="text-center py-4 px-6 border-b border-slate-300 dark:border-[#2a3347]">
                <p class="text-[10px] font-mono text-slate-400 mb-1">附件一　FM-20430-008</p>
                <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">
                  多媒體遊戲發展與應用系實務專題指導老師同意書
                </h2>
              </div>

              <!-- form table -->
              <table class="w-full text-sm" style="border-collapse: collapse;">

                <!-- 學年度 / 班級 / 組號 -->
                <tr>
                  <td colspan="2"
                      class="px-5 py-3 border-b border-slate-200 dark:border-[#2a3347]">
                    <div class="flex items-center gap-2 flex-wrap text-slate-700 dark:text-slate-300">
                      <span>學年：</span>
                      <select v-model="f1.school_year" class="input !w-24 !py-1">
                        <option value="">— 選擇 —</option>
                        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                      </select>
                      <span class="mx-1">·</span>
                      <span>班級：</span>
                      <select v-model="f1.class_" class="input !w-20 !py-1">
                        <option value="">— 選擇 —</option>
                        <option v-for="c in CLASS_OPTIONS" :key="c" :value="c">{{ c }}班</option>
                      </select>
                      <span class="mx-1">·</span>
                      <span>第</span>
                      <input v-model.number="f1.number" type="number" min="1"
                             class="input !w-16 !py-1" placeholder="1" />
                      <span>組</span>
                    </div>
                  </td>
                </tr>

                <!-- 指導老師 -->
                <tr>
                  <td class="cell-label">指導老師姓名</td>
                  <td class="cell-body">
                    <select v-model="f1.teacher_id" class="input !w-52 !py-1">
                      <option value="">— 選擇老師 —</option>
                      <option v-for="t in data.teachers" :key="t.id" :value="t.id">
                        {{ t.name }}
                      </option>
                    </select>
                    <p v-if="!data.teachers.length" class="text-xs text-slate-400 mt-1">
                      尚無老師資料，請先到「資料管理」新增
                    </p>
                  </td>
                </tr>

                <!-- 組長 -->
                <tr>
                  <td class="cell-label">組　長</td>
                  <td class="cell-body">
                    <div class="flex items-center gap-4 flex-wrap">
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-slate-500 dark:text-slate-400">學號：</span>
                        <input
                          v-model="f1.leader_sid"
                          class="input !w-32 !py-1"
                          placeholder="輸入學號"
                          :class="{
                            '!border-emerald-400 dark:!border-emerald-500': leaderState() === 'ok',
                            '!border-red-400': leaderState() === 'err',
                          }"
                        />
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-slate-500 dark:text-slate-400">姓名：</span>
                        <span
                          class="text-sm min-w-[4rem]"
                          :class="leaderStudent
                            ? 'font-semibold text-slate-800 dark:text-slate-100'
                            : 'text-slate-400 italic'"
                        >
                          {{ leaderStudent?.name ?? '（自動帶入）' }}
                        </span>
                      </div>
                      <span v-if="leaderState() === 'err'" class="text-xs text-red-500">
                        查無此學號
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- 組員 × 4 -->
                <tr v-for="(_, i) in f1.members" :key="i">
                  <td class="cell-label text-center">
                    {{ i === 0 ? '組　員' : '' }}
                  </td>
                  <td class="cell-body">
                    <div class="flex items-center gap-4 flex-wrap">
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-slate-500 dark:text-slate-400">學號：</span>
                        <input
                          v-model="f1.members[i]"
                          class="input !w-32 !py-1"
                          placeholder="可留空"
                          :class="{
                            '!border-emerald-400 dark:!border-emerald-500': memberState(i) === 'ok',
                            '!border-red-400': memberState(i) === 'err',
                          }"
                        />
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-slate-500 dark:text-slate-400">姓名：</span>
                        <span
                          class="text-sm min-w-[4rem]"
                          :class="memberStudents[i]
                            ? 'font-semibold text-slate-800 dark:text-slate-100'
                            : 'text-slate-400 italic'"
                        >
                          {{ memberStudents[i]?.name ?? '（選填）' }}
                        </span>
                      </div>
                      <span v-if="memberState(i) === 'err'" class="text-xs text-red-500">
                        查無此學號
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- 專題題目 -->
                <tr>
                  <td class="cell-label">專題題目</td>
                  <td class="cell-body">
                    <input
                      v-model="f1.title"
                      class="input !py-1"
                      placeholder="請輸入專題題目"
                    />
                  </td>
                </tr>

                <!-- 類別 -->
                <tr>
                  <td class="cell-label">類　　別</td>
                  <td class="cell-body">
                    <select v-model="f1.category" class="input !w-52 !py-1">
                      <option value="">— 選擇類別 —</option>
                      <option v-for="c in CATEGORY_OPTIONS" :key="c" :value="c">{{ c }}</option>
                    </select>
                    <p v-if="!CATEGORY_OPTIONS.length" class="text-xs text-slate-400 mt-1">
                      類別選項尚未設定
                    </p>
                  </td>
                </tr>

                <!-- 備註 -->
                <tr>
                  <td class="cell-label align-top pt-3">備　　註</td>
                  <td class="cell-body">
                    <textarea
                      v-model="f1.note"
                      rows="3"
                      class="input resize-none !py-1.5 text-sm"
                      placeholder="備註（不會送出至系統，僅供參考）"
                    />
                  </td>
                </tr>
              </table>

              <!-- footer / submit -->
              <div class="flex items-center justify-between px-5 py-4
                          border-t border-slate-200 dark:border-[#2a3347]">
                <p v-if="f1Error" class="text-sm text-red-500">{{ f1Error }}</p>
                <span v-else class="text-xs text-slate-400">
                  ＊ 標記為綠色的學號表示已在系統中找到
                </span>
                <button @click="submitF1" class="btn-primary flex items-center gap-1.5">
                  預覽並送出 <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- STEP: preview -->
          <div v-else-if="f1Step === 'preview'" class="max-w-xl">
            <div class="card p-6 space-y-5">
              <div class="flex items-center gap-3">
                <button
                  @click="f1Step = 'form'"
                  class="btn-secondary flex items-center gap-1.5 !py-1.5 !px-3 text-xs"
                >
                  <ArrowLeft class="w-3.5 h-3.5" /> 返回修改
                </button>
                <h3 class="font-bold text-slate-800 dark:text-slate-100">確認操作清單</h3>
              </div>

              <p class="text-sm text-slate-500 dark:text-slate-400">
                以下操作將依序執行，確認後無法撤銷：
              </p>

              <div class="space-y-2">
                <div
                  v-for="(op, i) in previewOps"
                  :key="i"
                  class="flex items-start gap-3 p-3 rounded-lg
                         bg-slate-50 dark:bg-[#161b27]
                         border border-slate-200 dark:border-[#2a3347]"
                >
                  <span :class="['font-bold flex-shrink-0 mt-0.5 text-sm', op.color]">
                    {{ op.icon }}
                  </span>
                  <div>
                    <p class="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {{ op.text }}
                    </p>
                    <p class="text-xs text-slate-400 mt-0.5">{{ op.sub }}</p>
                  </div>
                </div>
              </div>

              <p v-if="f1ExecError" class="text-sm text-red-500">{{ f1ExecError }}</p>

              <div class="flex justify-end gap-3 pt-1">
                <button @click="f1Step = 'form'" class="btn-secondary">返回修改</button>
                <button
                  @click="executeF1"
                  class="btn-primary flex items-center gap-2"
                  :disabled="f1Executing"
                >
                  <Loader2 v-if="f1Executing" class="w-4 h-4 animate-spin" />
                  {{ f1Executing ? '執行中…' : '確認執行' }}
                </button>
              </div>
            </div>
          </div>

          <!-- STEP: done -->
          <div v-else-if="f1Step === 'done'" class="max-w-xl">
            <div class="card p-10 text-center space-y-4">
              <div class="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20
                          flex items-center justify-center mx-auto">
                <CheckCircle class="w-7 h-7 text-emerald-500" />
              </div>
              <h3 class="font-bold text-slate-800 dark:text-slate-100 text-lg">執行完成</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                組別已建立，組員已分配完畢。
              </p>
              <button @click="resetF1" class="btn-primary">建立另一份</button>
            </div>
          </div>
        </div>

        <!-- ─── 文件2：更改表（待實作）─────────────────────────────── -->
        <div v-else-if="activeDoc === 'form2'"
             class="flex flex-col items-center justify-center h-64 gap-3 text-center">
          <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#2a3347]
                      flex items-center justify-center">
            <FilePen class="w-6 h-6 text-slate-400" />
          </div>
          <p class="font-semibold text-slate-700 dark:text-slate-300">異動組別更改表</p>
          <p class="text-sm text-slate-400">指令映射尚未確認，待討論後開放</p>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.cell-label {
  @apply px-4 py-2.5 text-sm font-medium whitespace-nowrap align-middle
         text-slate-600 dark:text-slate-400
         bg-slate-50 dark:bg-[#161b27]
         border border-slate-200 dark:border-[#2a3347]
         w-28;
}
.cell-body {
  @apply px-4 py-2.5 align-middle
         border border-slate-200 dark:border-[#2a3347];
}
</style>
