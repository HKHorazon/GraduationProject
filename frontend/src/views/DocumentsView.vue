<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import {
  FileText, FilePen, ChevronRight,
  CheckCircle, Loader2, ShieldOff, Plus, X,
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

function groupNameById(id) {
  return data.groups.find((g) => g.id === id)?.name ?? id
}

// 該學年下一個未使用的組號
function nextFreeNumber(year) {
  const used = new Set(
    data.groups.filter((g) => g.school_year === year).map((g) => g.number)
  )
  let n = 1
  while (used.has(n)) n++
  return n
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

// 組長/組員檢核：學號存在、學年相符、未屬於其他組別
function studentIssueF1(s) {
  if (!s) return '查無此學號'
  if (f1.value.school_year && s.school_year !== f1.value.school_year) {
    return `學年不符（${s.school_year}）`
  }
  if (s.group_id) return `已屬於「${groupNameById(s.group_id)}」`
  return ''
}
const leaderIssue = computed(() =>
  f1.value.leader_sid.trim() ? studentIssueF1(leaderStudent.value) : ''
)
const memberIssues = computed(() =>
  f1.value.members.map((sid, i) => (sid.trim() ? studentIssueF1(memberStudents.value[i]) : ''))
)
function leaderState() {
  if (!f1.value.leader_sid.trim()) return ''
  return leaderIssue.value ? 'err' : 'ok'
}
function memberState(i) {
  if (!f1.value.members[i].trim()) return ''
  return memberIssues.value[i] ? 'err' : 'ok'
}

// 學年選定後直接帶入下一個未使用的組號
watch(() => f1.value.school_year, (y) => {
  if (y) f1.value.number = nextFreeNumber(y)
})

const f1Step = ref('form') // 'form' | 'preview' | 'done'
const f1Error = ref('')
const f1Executing = ref(false)
const f1ExecError = ref('')

function validateF1() {
  if (!f1.value.school_year.trim()) return '請填寫學年度'
  if (!f1.value.number) return '請填寫組號'
  if (data.groups.some(
    (g) => g.school_year === f1.value.school_year && g.number === Number(f1.value.number)
  )) {
    return `學年 ${f1.value.school_year} 已有第 ${f1.value.number} 組`
  }
  if (!f1.value.title.trim()) return '請填寫專題題目'
  if (!f1.value.category.trim()) return '請選擇類別'
  if (!f1.value.teacher_id) return '請選擇指導老師'
  if (!f1.value.leader_sid.trim()) return '請填寫組長學號'
  if (leaderIssue.value) return `組長：${leaderIssue.value}`
  for (let i = 0; i < f1.value.members.length; i++) {
    if (f1.value.members[i].trim() && memberIssues.value[i]) {
      return `組員 ${i + 1}：${memberIssues.value[i]}`
    }
  }
  return ''
}

function submitF1() {
  const err = validateF1()
  if (err) { f1Error.value = err; f1Step.value = 'form'; return }
  f1Error.value = ''
  f1Step.value = 'preview'
}

const previewOps = computed(() => {
  const teacher = data.teachers.find((t) => t.id === f1.value.teacher_id)
  const ops = [
    {
      icon: '✦',
      color: 'text-blue-700 dark:text-cyan-400',
      text: `建立新組別「${f1.value.title}」`,
      sub: `第 ${f1.value.number} 組・學年 ${f1.value.school_year}・指導老師：${teacher?.name ?? '—'}`,
    },
  ]
  if (leaderStudent.value) {
    ops.push({
      icon: '★',
      color: 'text-amber-800 dark:text-amber-400',
      text: `設定組長：${leaderStudent.value.name}（${leaderStudent.value.student_id}）`,
      sub: '加入本組並標記為組長',
    })
  }
  memberStudents.value.forEach((s) => {
    if (s) {
      ops.push({
        icon: '◆',
        color: 'text-slate-600 dark:text-slate-400',
        text: `加入組員：${s.name}（${s.student_id}）`,
        sub: '加入本組',
      })
    }
  })
  return ops
})

async function executeF1() {
  if (f1Executing.value) return
  // 清單跟著表單即時更新，執行前需再驗證一次
  const err = validateF1()
  if (err) { f1Error.value = err; f1Step.value = 'form'; return }
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

// ── Form 2 state（附件二：更改專題指導老師申請表）──────────────────
// 紙本為「原 → 新」對照：原/新專題名稱、原/新組員（組長＋組員）、原/新指導老師。
// 異動類型由「新專題名稱」自動判定：
//   同原題目             → 整組更換指導老師（可同時調整名單）
//   新題目＝現有組題目   → 轉入現有組別
//   新題目不存在         → 成立新組
// 實際操作 = 新舊名單的差異（加入／移出／組長變更）。
const F2_SAME = '__same__'
const F2_NEW = '__new__'

const f2 = ref({
  source_group_id: '',   // 原組別
  dest: '',              // F2_SAME | F2_NEW | 現有組別 id
  teacher_id: '',        // 新指導老師
  new_title: '',
  new_school_year: '',
  new_number: '',
  new_category: '',
  new_leader: '',        // 新組長學號
  new_members: ['', '', '', ''], // 新組員學號
  reason: '',            // 申請原因（不送出，僅供參考）
})
const f2Step = ref('form') // 'form' | 'preview' | 'done'
const f2Error = ref('')
const f2Executing = ref(false)
const f2ExecError = ref('')

function teacherNameById(id) {
  return data.teachers.find((t) => t.id === id)?.name ?? '—'
}
function groupTeachers(g) {
  return g ? g.teacher_ids.map(teacherNameById).join('、') || '—' : '—'
}

// ── 原組別（左欄，唯讀）─────────────────────────────────────────
const f2SourceGroup = computed(() =>
  data.groups.find((g) => g.id === f2.value.source_group_id) ?? null
)
const f2OrigLeader = computed(() =>
  f2SourceGroup.value
    ? data.students.find((s) => s.id === f2SourceGroup.value.leader_id) ?? null
    : null
)
const f2OrigMembers = computed(() =>
  f2SourceGroup.value
    ? data.students.filter(
        (s) => s.group_id === f2SourceGroup.value.id && s.id !== f2SourceGroup.value.leader_id
      )
    : []
)
const f2SourceGroups = computed(() =>
  [...data.groups].sort((a, b) =>
    a.school_year === b.school_year
      ? a.number - b.number
      : String(b.school_year).localeCompare(String(a.school_year))
  )
)

// ── 新專題（條件判定）───────────────────────────────────────────
// 可轉入的現有組別（同學年、排除原組）
const f2DestGroups = computed(() => {
  const year = f2SourceGroup.value?.school_year
  return data.groups
    .filter((g) => (!year || g.school_year === year) && g.id !== f2SourceGroup.value?.id)
    .sort((a, b) => a.number - b.number)
})
const f2DestGroup = computed(() =>
  f2.value.dest && f2.value.dest !== F2_SAME && f2.value.dest !== F2_NEW
    ? data.groups.find((g) => g.id === f2.value.dest) ?? null
    : null
)
const f2Cond = computed(() => {
  if (f2.value.dest === F2_SAME) return 'teacher'
  if (f2.value.dest === F2_NEW) return 'create'
  if (f2.value.dest) return 'join'
  return ''
})
const F2_COND_LABEL = {
  teacher: '整組更換指導老師（題目不變）',
  join: '轉入現有組別',
  create: '成立新組',
}
// 目的組：同原題目 → 原組；轉入 → 選定組；成立新組 → 尚未存在
const f2TargetGroup = computed(() =>
  f2Cond.value === 'teacher' ? f2SourceGroup.value
  : f2Cond.value === 'join' ? f2DestGroup.value
  : null
)
const f2TargetYear = computed(() =>
  f2Cond.value === 'create'
    ? f2.value.new_school_year
    : f2TargetGroup.value?.school_year ?? ''
)

// ── 新組員名單（右欄）───────────────────────────────────────────
const f2NewLeader = computed(() =>
  f2.value.new_leader.trim() ? findByStudentId(f2.value.new_leader) : null
)
const f2NewMembers = computed(() =>
  f2.value.new_members.map((sid) => (sid.trim() ? findByStudentId(sid) : null))
)
const f2NewRoster = computed(() =>
  [f2NewLeader.value, ...f2NewMembers.value].filter(Boolean)
)

// 名單檢核：學號存在、學年與目的組相符
function f2Issue(sid, s) {
  if (!sid.trim()) return ''
  if (!s) return '查無此學號'
  if (f2TargetYear.value && s.school_year !== f2TargetYear.value) {
    return `學年不符（${s.school_year}）`
  }
  return ''
}
const f2LeaderIssue = computed(() => f2Issue(f2.value.new_leader, f2NewLeader.value))
const f2MemberIssues = computed(() =>
  f2.value.new_members.map((sid, i) => f2Issue(sid, f2NewMembers.value[i]))
)
function f2LeaderState() {
  if (!f2.value.new_leader.trim()) return ''
  return f2LeaderIssue.value ? 'err' : 'ok'
}
function f2MemberState(i) {
  if (!f2.value.new_members[i].trim()) return ''
  return f2MemberIssues.value[i] ? 'err' : 'ok'
}

function addF2Member() {
  if (f2.value.new_members.length < 6) f2.value.new_members.push('')
}
function removeF2Member(i) {
  if (f2.value.new_members.length > 1) f2.value.new_members.splice(i, 1)
}
// 列數 = 原/新名單較長者，左右並排對照
const f2MemberRowIdx = computed(() => {
  const n = Math.max(f2.value.new_members.length, f2OrigMembers.value.length)
  return Array.from({ length: n }, (_, i) => i)
})

// 切換目的時，把新名單預填為對應組的現有成員
function f2Prefill(g) {
  const ldr = g ? data.students.find((s) => s.id === g.leader_id) ?? null : null
  const mems = g
    ? data.students.filter((s) => s.group_id === g.id && s.id !== g.leader_id)
    : []
  f2.value.new_leader = ldr?.student_id ?? ''
  const arr = mems.map((s) => s.student_id)
  while (arr.length < 4) arr.push('')
  f2.value.new_members = arr.slice(0, 6)
}
watch(() => f2.value.dest, (d) => {
  f2Error.value = ''
  if (d === F2_SAME || d === F2_NEW) f2Prefill(f2SourceGroup.value)
  else if (d) f2Prefill(data.groups.find((g) => g.id === d) ?? null)
  if (d === F2_NEW && !f2.value.new_school_year) {
    f2.value.new_school_year = f2SourceGroup.value?.school_year ?? ''
  }
})
watch(() => f2.value.source_group_id, () => {
  // 原組改變 → 目的與名單重新開始
  f2.value.dest = ''
  f2.value.new_leader = ''
  f2.value.new_members = ['', '', '', '']
  f2Error.value = ''
})
watch(() => f2.value.new_school_year, (y) => {
  if (!y || f2.value.new_number) return
  f2.value.new_number = nextFreeNumber(y)
})

// ── 名單差異 → 操作 ─────────────────────────────────────────────
const f2Diff = computed(() => {
  const destId = f2TargetGroup.value?.id ?? null // create 時為 null
  const roster = f2NewRoster.value
  const rosterIds = new Set(roster.map((s) => s.id))
  // 加入：在新名單但不在目的組
  const moves = destId ? roster.filter((s) => s.group_id !== destId) : [...roster]
  // 移出：原本在目的組但不在新名單 → 變未分組
  const removals = destId
    ? data.students.filter((s) => s.group_id === destId && !rosterIds.has(s.id))
    : []
  // 其他組別因成員轉出而失去組長 → 先清空
  const movingIds = new Set(moves.map((s) => s.id))
  const leaderClears = []
  for (const gid of [...new Set(moves.map((s) => s.group_id).filter(Boolean))]) {
    if (gid === destId) continue
    const g = data.groups.find((x) => x.id === gid)
    if (g?.leader_id && movingIds.has(g.leader_id)) leaderClears.push(g)
  }
  return { destId, moves, removals, leaderClears }
})

function validateF2() {
  const v = f2.value
  if (!v.source_group_id) return '請選擇原組別'
  if (!f2Cond.value) return '請選擇新專題名稱（或同原題目）'
  if (!v.teacher_id) return '請選擇新指導老師'

  // 新名單檢核
  if (!v.new_leader.trim()) return '請填寫新組長學號'
  if (f2LeaderIssue.value) return `組長：${f2LeaderIssue.value}`
  for (let i = 0; i < v.new_members.length; i++) {
    if (v.new_members[i].trim() && f2MemberIssues.value[i]) {
      return `組員 ${i + 1}：${f2MemberIssues.value[i]}`
    }
  }
  const ids = f2NewRoster.value.map((s) => s.id)
  if (new Set(ids).size !== ids.length) return '新名單中有重複的學號'

  if (f2Cond.value === 'join') {
    const g = f2DestGroup.value
    if (!g) return '請選擇轉入的組別'
    if (!g.teacher_ids.includes(v.teacher_id)) {
      return `新指導老師與「${g.name}」現任指導老師（${groupTeachers(g)}）不符，請修正`
    }
  }

  if (f2Cond.value === 'create') {
    if (!v.new_title.trim()) return '請填寫新專題題目'
    if (!v.new_school_year) return '請選擇學年度'
    if (data.groups.some(
      (g) => g.name === v.new_title.trim() && g.school_year === v.new_school_year
    )) {
      return '同學年已有相同題目的組別，請改用「轉入現有組別」'
    }
    if (!v.new_number) return '請填寫組號'
    if (data.groups.some(
      (g) => g.school_year === v.new_school_year && g.number === Number(v.new_number)
    )) {
      return `學年 ${v.new_school_year} 已有第 ${v.new_number} 組`
    }
  }

  // 整組換老師／轉入：至少要有實際變更
  if (f2Cond.value !== 'create') {
    const { moves, removals } = f2Diff.value
    const target = f2TargetGroup.value
    const leaderChanged = f2NewLeader.value && target?.leader_id !== f2NewLeader.value.id
    const teacherChanged =
      f2Cond.value === 'teacher' &&
      !(target?.teacher_ids.length === 1 && target.teacher_ids[0] === v.teacher_id)
    if (!moves.length && !removals.length && !leaderChanged && !teacherChanged) {
      return '內容與現況相同，沒有任何變更'
    }
  }
  return ''
}

function submitF2() {
  const err = validateF2()
  if (err) { f2Error.value = err; f2Step.value = 'form'; return }
  f2Error.value = ''
  f2Step.value = 'preview'
}

const previewOps2 = computed(() => {
  const v = f2.value
  const ops = []
  if (!f2Cond.value) return ops
  const { moves, removals, leaderClears } = f2Diff.value
  const destName =
    f2Cond.value === 'create' ? v.new_title.trim() : f2TargetGroup.value?.name ?? ''

  // 1. 其他組別因成員轉出而失去組長
  for (const g of leaderClears) {
    const ldr = data.students.find((s) => s.id === g.leader_id)
    ops.push({
      icon: '★',
      color: 'text-amber-800 dark:text-amber-400',
      text: `清除「${g.name}」的組長`,
      sub: `${ldr?.name ?? ''} 轉出，原組保留`,
    })
  }

  // 2. 成立新組
  if (f2Cond.value === 'create') {
    ops.push({
      icon: '✦',
      color: 'text-blue-700 dark:text-cyan-400',
      text: `建立新組別「${destName}」`,
      sub: `第 ${v.new_number} 組・學年 ${v.new_school_year}・指導老師：${teacherNameById(v.teacher_id)}${v.new_category ? '・' + v.new_category : ''}`,
    })
  }

  // 3. 加入新名單成員
  for (const s of moves) {
    const src = s.group_id ? data.groups.find((x) => x.id === s.group_id) : null
    ops.push({
      icon: '◆',
      color: 'text-slate-600 dark:text-slate-400',
      text: `將 ${s.name}（${s.student_id}）加入「${destName}」`,
      sub: `原：${src?.name ?? '未分組'}`,
    })
  }

  // 4. 移出不在新名單者
  for (const s of removals) {
    ops.push({
      icon: '◇',
      color: 'text-red-700 dark:text-red-400',
      text: `將 ${s.name}（${s.student_id}）移出「${destName}」`,
      sub: '變為未分組',
    })
  }

  // 5. 組長變更
  const newLeader = f2NewLeader.value
  if (newLeader && (f2Cond.value === 'create' || f2TargetGroup.value?.leader_id !== newLeader.id)) {
    ops.push({
      icon: '★',
      color: 'text-amber-800 dark:text-amber-400',
      text: `設定組長：${newLeader.name}（${newLeader.student_id}）`,
      sub: `「${destName}」的組長`,
    })
  }

  // 6. 整組換老師
  if (f2Cond.value === 'teacher') {
    const g = f2SourceGroup.value
    if (g && !(g.teacher_ids.length === 1 && g.teacher_ids[0] === v.teacher_id)) {
      ops.push({
        icon: '✦',
        color: 'text-blue-700 dark:text-cyan-400',
        text: `「${destName}」指導老師改為：${teacherNameById(v.teacher_id)}`,
        sub: `原指導老師：${groupTeachers(g)}`,
      })
    }
  }
  return ops
})

async function executeF2() {
  if (f2Executing.value) return
  // 清單跟著表單即時更新，執行前需再驗證一次
  const err = validateF2()
  if (err) { f2Error.value = err; f2Step.value = 'form'; return }
  f2Executing.value = true
  f2ExecError.value = ''
  try {
    const v = f2.value
    // 先把差異快照下來，執行過程中資料會逐步變動
    const { moves, removals, leaderClears } = f2Diff.value
    const newLeader = f2NewLeader.value
    const targetBefore = f2TargetGroup.value

    // 1. 其他組別失去組長 → 先清空
    for (const g of leaderClears) {
      await data.updateGroup(g.id, { leader_id: null })
    }
    // 2. 成立新組
    let destId = targetBefore?.id ?? null
    if (f2Cond.value === 'create') {
      const created = await data.createGroup({
        school_year: v.new_school_year,
        number: Number(v.new_number),
        name: v.new_title.trim(),
        category: v.new_category.trim() || null,
        leader_id: null,
        teacher_ids: [v.teacher_id],
      })
      destId = created.id
    }
    // 3. 加入新名單成員
    for (const s of moves) {
      await data.updateStudent(s.id, { group_id: destId })
    }
    // 4. 移出不在新名單者（變未分組）
    for (const s of removals) {
      await data.updateStudent(s.id, { group_id: null })
    }
    // 5. 設定組長
    if (newLeader && (f2Cond.value === 'create' || targetBefore?.leader_id !== newLeader.id)) {
      await data.updateGroup(destId, { leader_id: newLeader.id })
    }
    // 6. 整組換老師
    if (f2Cond.value === 'teacher') {
      await data.updateGroup(destId, { teacher_ids: [v.teacher_id] })
    }
    f2Step.value = 'done'
  } catch (e) {
    f2ExecError.value = e.message ?? '執行失敗，請重試'
  } finally {
    f2Executing.value = false
  }
}

function resetF2() {
  f2.value = {
    source_group_id: '', dest: '', teacher_id: '', new_title: '',
    new_school_year: '', new_number: '', new_category: '',
    new_leader: '', new_members: ['', '', '', ''], reason: '',
  }
  f2Error.value = ''
  f2ExecError.value = ''
  f2Step.value = 'form'
}
</script>

<template>
  <AppLayout>
    <!-- no permission -->
    <div v-if="!auth.isEditor"
         class="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#2a3347] flex items-center justify-center">
        <ShieldOff class="w-6 h-6 text-slate-600 dark:text-slate-400" />
      </div>
      <p class="font-semibold text-slate-700 dark:text-slate-300">無編輯權限</p>
      <p class="text-sm text-slate-600 dark:text-slate-400">此頁面僅限編輯者使用</p>
    </div>

    <div v-else class="flex gap-5 h-full">

      <!-- ═══ LEFT: doc sidebar ═══ -->
      <div class="w-44 flex-shrink-0 flex flex-col gap-1.5">
        <p class="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-1 mb-2 dark:text-slate-400">
          文件專區
        </p>

        <button
          v-for="doc in [
            { key: 'form1', icon: FileText, label: '同意書', sub: '附件一・建立組別' },
            { key: 'form2', icon: FilePen,  label: '更改表', sub: '附件二・專題異動' },
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

          <!-- STEP: form（預覽時右側顯示指令清單）-->
          <div v-if="f1Step !== 'done'" class="flex gap-5 items-start flex-wrap">
          <div class="max-w-2xl flex-1 min-w-[26rem]">
            <div class="bg-white dark:bg-[#1e2535] border border-slate-300 dark:border-[#2a3347] rounded-xl overflow-hidden shadow-sm">

              <!-- header -->
              <div class="text-center py-4 px-6 border-b border-slate-300 dark:border-[#2a3347]">
                <p class="text-[10px] font-mono text-slate-600 mb-1 dark:text-slate-400">附件一　FM-20430-008</p>
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
                    <p v-if="!data.teachers.length" class="text-xs text-slate-600 mt-1 dark:text-slate-400">
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
                        <span class="text-xs text-slate-600 dark:text-slate-400">學號：</span>
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
                        <span class="text-xs text-slate-600 dark:text-slate-400">姓名：</span>
                        <span
                          class="text-sm min-w-[4rem]"
                          :class="leaderStudent
                            ? 'font-semibold text-slate-800 dark:text-slate-100'
                            : 'text-slate-600 dark:text-slate-400 italic'"
                        >
                          {{ leaderStudent?.name ?? '（自動帶入）' }}
                        </span>
                      </div>
                      <span v-if="leaderState() === 'err'" class="text-xs text-red-700 dark:text-red-400">
                        {{ leaderIssue }}
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
                        <span class="text-xs text-slate-600 dark:text-slate-400">學號：</span>
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
                        <span class="text-xs text-slate-600 dark:text-slate-400">姓名：</span>
                        <span
                          class="text-sm min-w-[4rem]"
                          :class="memberStudents[i]
                            ? 'font-semibold text-slate-800 dark:text-slate-100'
                            : 'text-slate-600 dark:text-slate-400 italic'"
                        >
                          {{ memberStudents[i]?.name ?? '（選填）' }}
                        </span>
                      </div>
                      <span v-if="memberState(i) === 'err'" class="text-xs text-red-700 dark:text-red-400">
                        {{ memberIssues[i] }}
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
                    <p v-if="!CATEGORY_OPTIONS.length" class="text-xs text-slate-600 mt-1 dark:text-slate-400">
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
              <div class="space-y-3 px-5 py-4
                          border-t border-slate-200 dark:border-[#2a3347]">
                <p v-if="f1Error" class="text-sm text-red-700 dark:text-red-400">{{ f1Error }}</p>
                <span v-else class="text-xs text-slate-600 dark:text-slate-400">
                  ＊ 標記為綠色的學號表示已在系統中找到
                </span>
                <button @click="submitF1" class="btn-primary flex items-center gap-1.5">
                  預覽並送出 <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- 指令清單（右側面板，吃滿剩餘寬度）-->
          <div v-if="f1Step === 'preview'" class="flex-1 min-w-[20rem] sticky top-0">
            <div class="card p-5 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-slate-800 dark:text-slate-100">確認操作清單</h3>
                <button
                  @click="f1Step = 'form'"
                  class="text-slate-600 hover:text-red-500 transition-colors cursor-pointer dark:text-slate-400"
                  title="關閉清單"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>

              <p class="text-xs text-slate-600 dark:text-slate-400">
                依左側表單內容即時更新；確認後依序執行，無法撤銷。
              </p>

              <p v-if="f1ExecError" class="text-sm text-red-700 dark:text-red-400">{{ f1ExecError }}</p>

              <button
                @click="executeF1"
                class="btn-primary w-full flex items-center justify-center gap-2"
                :disabled="f1Executing || !previewOps.length"
              >
                <Loader2 v-if="f1Executing" class="w-4 h-4 animate-spin" />
                {{ f1Executing ? '執行中…' : '確認執行' }}
              </button>

              <div class="grid grid-cols-1 gap-2">
                <div
                  v-for="(op, i) in previewOps"
                  :key="i"
                  class="flex items-start gap-2.5 p-2.5 rounded-lg
                         bg-slate-50 dark:bg-[#161b27]
                         border border-slate-200 dark:border-[#2a3347]"
                >
                  <span :class="['font-bold flex-shrink-0 mt-0.5 text-sm', op.color]">
                    {{ op.icon }}
                  </span>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {{ op.text }}
                    </p>
                    <p class="text-xs text-slate-600 mt-0.5 dark:text-slate-400">{{ op.sub }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          <!-- STEP: done -->
          <div v-else>
            <div class="card p-10 text-center space-y-4">
              <div class="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20
                          flex items-center justify-center mx-auto">
                <CheckCircle class="w-7 h-7 text-emerald-800 dark:text-emerald-400" />
              </div>
              <h3 class="font-bold text-slate-800 dark:text-slate-100 text-lg">執行完成</h3>
              <p class="text-sm text-slate-600 dark:text-slate-400">
                組別已建立，組員已分配完畢。
              </p>
              <button @click="resetF1" class="btn-primary">建立另一份</button>
            </div>
          </div>
        </div>

        <!-- ─── 文件2：專題異動申請表 ──────────────────────────────── -->
        <div v-else-if="activeDoc === 'form2'">

          <!-- STEP: form（預覽時右側顯示指令清單）-->
          <div v-if="f2Step !== 'done'" class="flex gap-5 items-start flex-wrap">
          <div class="max-w-3xl flex-1 min-w-[28rem]">
            <div class="bg-white dark:bg-[#1e2535] border border-slate-300 dark:border-[#2a3347] rounded-xl overflow-hidden shadow-sm">

              <!-- header -->
              <div class="text-center py-4 px-6 border-b border-slate-300 dark:border-[#2a3347]">
                <p class="text-[10px] font-mono text-slate-600 mb-1 dark:text-slate-400">附件二　FM-20430-015</p>
                <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">
                  多媒體遊戲發展與應用系更改專題指導老師申請表
                </h2>
              </div>

              <!-- form table -->
              <table class="w-full text-sm" style="border-collapse: collapse;">
                <tbody>

                  <!-- 原組別 -->
                  <tr>
                    <td class="cell-label">原組別</td>
                    <td class="cell-body" colspan="2">
                      <select v-model="f2.source_group_id" class="input !w-full !py-1">
                        <option value="">— 選擇組別 —</option>
                        <option v-for="g in f2SourceGroups" :key="g.id" :value="g.id">
                          {{ g.school_year }} 學年・第 {{ g.number }} 組・{{ g.name }}
                        </option>
                      </select>
                    </td>
                  </tr>

                  <template v-if="f2SourceGroup">
                    <!-- 原 / 新 欄位表頭 -->
                    <tr>
                      <td class="cell-label"></td>
                      <td class="cell-head w-[34%]">原</td>
                      <td class="cell-head">新</td>
                    </tr>

                    <!-- 專題名稱 -->
                    <tr>
                      <td class="cell-label">專題名稱</td>
                      <td class="cell-body">
                        <span class="font-medium text-slate-800 dark:text-slate-100">
                          {{ f2SourceGroup.name }}
                        </span>
                      </td>
                      <td class="cell-body">
                        <select v-model="f2.dest" class="input !w-full !py-1">
                          <option value="">— 選擇 —</option>
                          <option :value="F2_SAME">同原題目</option>
                          <optgroup label="轉入現有組別">
                            <option v-for="g in f2DestGroups" :key="g.id" :value="g.id">
                              第 {{ g.number }} 組・{{ g.name }}
                            </option>
                          </optgroup>
                          <option :value="F2_NEW">✏️ 自訂新題目（成立新組）…</option>
                        </select>
                        <input
                          v-if="f2Cond === 'create'"
                          v-model="f2.new_title"
                          class="input !py-1 mt-2"
                          placeholder="輸入新專題題目"
                        />
                        <p v-if="f2Cond" class="text-xs mt-1.5 font-medium text-blue-700 dark:text-cyan-400">
                          判定：{{ F2_COND_LABEL[f2Cond] }}
                        </p>
                      </td>
                    </tr>

                    <!-- 指導老師 -->
                    <tr>
                      <td class="cell-label">指導老師</td>
                      <td class="cell-body">{{ groupTeachers(f2SourceGroup) }}</td>
                      <td class="cell-body">
                        <select v-model="f2.teacher_id" class="input !w-full !py-1">
                          <option value="">— 選擇老師 —</option>
                          <option v-for="t in data.teachers" :key="t.id" :value="t.id">
                            {{ t.name }}
                          </option>
                        </select>
                        <p v-if="f2Cond === 'join' && f2DestGroup" class="text-xs text-slate-600 mt-1 dark:text-slate-400">
                          須與該組現任相同：{{ groupTeachers(f2DestGroup) }}
                        </p>
                      </td>
                    </tr>

                    <!-- 組長（原 / 新對照）-->
                    <tr>
                      <td class="cell-label">組　　長</td>
                      <td class="cell-body">
                        <span v-if="f2OrigLeader">
                          {{ f2OrigLeader.student_id }}　{{ f2OrigLeader.name }}
                        </span>
                        <span v-else class="text-slate-600 italic dark:text-slate-400">（未設定）</span>
                      </td>
                      <td class="cell-body">
                        <div class="flex items-center gap-2 flex-wrap">
                          <input
                            v-model="f2.new_leader"
                            class="input !w-28 !py-1"
                            placeholder="學號"
                            :class="{
                              '!border-emerald-400 dark:!border-emerald-500': f2LeaderState() === 'ok',
                              '!border-red-400': f2LeaderState() === 'err',
                            }"
                          />
                          <span
                            class="text-sm"
                            :class="f2NewLeader
                              ? 'font-semibold text-slate-800 dark:text-slate-100'
                              : 'text-slate-600 dark:text-slate-400 italic'"
                          >
                            {{ f2NewLeader?.name ?? '（自動帶入）' }}
                          </span>
                          <span v-if="f2LeaderState() === 'err'" class="text-xs text-red-700 dark:text-red-400">
                            {{ f2LeaderIssue }}
                          </span>
                        </div>
                      </td>
                    </tr>

                    <!-- 組員（原 / 新對照）× N -->
                    <tr v-for="i in f2MemberRowIdx" :key="i">
                      <td class="cell-label text-center">
                        {{ i === 0 ? '組　　員' : '' }}
                      </td>
                      <td class="cell-body">
                        <span v-if="f2OrigMembers[i]">
                          {{ f2OrigMembers[i].student_id }}　{{ f2OrigMembers[i].name }}
                        </span>
                        <span v-else class="text-slate-300 dark:text-slate-400">—</span>
                      </td>
                      <td class="cell-body">
                        <div v-if="i < f2.new_members.length" class="flex items-center gap-2 flex-wrap">
                          <input
                            v-model="f2.new_members[i]"
                            class="input !w-28 !py-1"
                            placeholder="可留空"
                            :class="{
                              '!border-emerald-400 dark:!border-emerald-500': f2MemberState(i) === 'ok',
                              '!border-red-400': f2MemberState(i) === 'err',
                            }"
                          />
                          <span
                            class="text-sm"
                            :class="f2NewMembers[i]
                              ? 'font-semibold text-slate-800 dark:text-slate-100'
                              : 'text-slate-600 dark:text-slate-400 italic'"
                          >
                            {{ f2NewMembers[i]?.name ?? '' }}
                          </span>
                          <span v-if="f2MemberState(i) === 'err'" class="text-xs text-red-700 dark:text-red-400">
                            {{ f2MemberIssues[i] }}
                          </span>
                          <button
                            v-if="f2.new_members.length > 1"
                            @click="removeF2Member(i)"
                            class="ml-auto text-slate-600 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
                            title="移除這一列"
                          >
                            <X class="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span v-else class="text-slate-300 dark:text-slate-400">—</span>
                      </td>
                    </tr>
                    <tr v-if="f2.new_members.length < 6">
                      <td class="cell-label"></td>
                      <td class="cell-body"></td>
                      <td class="cell-body">
                        <button
                          @click="addF2Member"
                          class="flex items-center gap-1 text-xs text-blue-700 dark:text-cyan-400
                                 hover:underline cursor-pointer"
                        >
                          <Plus class="w-3.5 h-3.5" /> 新增一位
                        </button>
                      </td>
                    </tr>

                    <!-- 成立新組：學年 / 組號 / 類別 -->
                    <tr v-if="f2Cond === 'create'">
                      <td class="cell-label">新組資料</td>
                      <td class="cell-body" colspan="2">
                        <div class="flex items-center gap-2 flex-wrap text-slate-700 dark:text-slate-300">
                          <span>學年：</span>
                          <select v-model="f2.new_school_year" class="input !w-24 !py-1">
                            <option value="">— 選擇 —</option>
                            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                          </select>
                          <span class="mx-1">·</span>
                          <span>第</span>
                          <input v-model.number="f2.new_number" type="number" min="1"
                                 class="input !w-16 !py-1" placeholder="1" />
                          <span>組</span>
                          <span class="mx-1">·</span>
                          <select v-model="f2.new_category" class="input !w-32 !py-1">
                            <option value="">— 類別 —</option>
                            <option v-for="c in CATEGORY_OPTIONS" :key="c" :value="c">{{ c }}</option>
                          </select>
                        </div>
                      </td>
                    </tr>

                    <!-- 申請原因 -->
                    <tr>
                      <td class="cell-label align-top pt-3">申請原因</td>
                      <td class="cell-body" colspan="2">
                        <textarea
                          v-model="f2.reason"
                          rows="2"
                          class="input resize-none !py-1.5 text-sm"
                          placeholder="申請原因（不會送出至系統，僅供參考）"
                        />
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>

              <!-- footer / submit -->
              <div class="space-y-3 px-5 py-4
                          border-t border-slate-200 dark:border-[#2a3347]">
                <p v-if="f2Error" class="text-sm text-red-700 dark:text-red-400">{{ f2Error }}</p>
                <span v-else class="text-xs text-slate-600 dark:text-slate-400">
                  ＊ 異動類型由「新專題名稱」自動判定；執行以「新」欄名單為準
                </span>
                <button @click="submitF2" class="btn-primary flex items-center gap-1.5">
                  預覽並送出 <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- 指令清單（右側面板，吃滿剩餘寬度）-->
          <div v-if="f2Step === 'preview'" class="flex-1 min-w-[20rem] sticky top-0">
            <div class="card p-5 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-slate-800 dark:text-slate-100">確認操作清單</h3>
                <button
                  @click="f2Step = 'form'"
                  class="text-slate-600 hover:text-red-500 transition-colors cursor-pointer dark:text-slate-400"
                  title="關閉清單"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>

              <p class="text-xs font-medium text-blue-700 dark:text-cyan-400">
                判定：{{ F2_COND_LABEL[f2Cond] }}
              </p>
              <p class="text-xs text-slate-600 dark:text-slate-400">
                依左側表單內容即時更新；確認後依序執行，無法撤銷。
              </p>

              <p v-if="f2ExecError" class="text-sm text-red-700 dark:text-red-400">{{ f2ExecError }}</p>

              <button
                @click="executeF2"
                class="btn-primary w-full flex items-center justify-center gap-2"
                :disabled="f2Executing || !previewOps2.length"
              >
                <Loader2 v-if="f2Executing" class="w-4 h-4 animate-spin" />
                {{ f2Executing ? '執行中…' : '確認執行' }}
              </button>

              <div class="grid grid-cols-1 gap-2">
                <div
                  v-for="(op, i) in previewOps2"
                  :key="i"
                  class="flex items-start gap-2.5 p-2.5 rounded-lg
                         bg-slate-50 dark:bg-[#161b27]
                         border border-slate-200 dark:border-[#2a3347]"
                >
                  <span :class="['font-bold flex-shrink-0 mt-0.5 text-sm', op.color]">
                    {{ op.icon }}
                  </span>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {{ op.text }}
                    </p>
                    <p class="text-xs text-slate-600 mt-0.5 dark:text-slate-400">{{ op.sub }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          <!-- STEP: done -->
          <div v-else>
            <div class="card p-10 text-center space-y-4">
              <div class="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20
                          flex items-center justify-center mx-auto">
                <CheckCircle class="w-7 h-7 text-emerald-800 dark:text-emerald-400" />
              </div>
              <h3 class="font-bold text-slate-800 dark:text-slate-100 text-lg">執行完成</h3>
              <p class="text-sm text-slate-600 dark:text-slate-400">
                專題異動已完成。
              </p>
              <button @click="resetF2" class="btn-primary">建立另一份</button>
            </div>
          </div>
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
.cell-head {
  @apply px-4 py-1.5 text-xs font-semibold text-center
         text-slate-600 dark:text-slate-400
         bg-slate-100 dark:bg-[#1a2030]
         border border-slate-200 dark:border-[#2a3347];
}
</style>
