<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore, GUEST_GROUP, PAGES } from '@/stores/permissions'
import { useDataStore } from '@/stores/data'
import { api } from '@/lib/api'
import { ShieldOff, UserPlus, Trash2, Save, X, Shield, Edit3, Eye } from 'lucide-vue-next'

const auth = useAuthStore()
const perms = usePermissionsStore()
const data = useDataStore()

const list = ref([])
const loadError = ref('')
const teachers = computed(() => data.teachers)

async function loadAccounts() {
  loadError.value = ''
  try {
    list.value = await api.get('/accounts')
  } catch (e) {
    loadError.value = e.message ?? '載入帳號失敗'
  }
}

onMounted(() => {
  if (auth.isAdmin) loadAccounts()
  data.loadAll()
})

// 可指派的分組來自權限設定（/permissions），不再是寫死的三種。
// 「未登入訪客」是給沒有帳號的人用的，不能指派。
const ROLES = computed(() =>
  perms.groups.filter(g => g.key !== GUEST_GROUP).map(g => g.key)
)
function roleLabel(key) { return perms.groupLabel(key) }
function roleColor(key) {
  if (perms.isAdminGroup(key)) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400'
  // 有任何一頁可編輯就算編輯型分組
  const canEditAny = PAGES.some(p => perms.canEdit(p.key, key))
  return canEditAny
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-cyan-400'
    : 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300'
}
function roleIcon(key) {
  if (perms.isAdminGroup(key)) return Shield
  return PAGES.some(p => perms.canEdit(p.key, key)) ? Edit3 : Eye
}

function teacherName(tid) {
  return teachers.value.find(t => t.id === tid)?.name ?? '—'
}

// --- Inline edit ---
const editing = ref(null)

function startEdit(acc) { editing.value = { ...acc, teacher_id: acc.teacher_id ?? '' } }
function cancelEdit() { editing.value = null }
async function saveEdit() {
  try {
    const updated = await api.patch(`/accounts/${editing.value.id}`, {
      username: editing.value.username,
      role: editing.value.role,
      teacher_id: editing.value.teacher_id || null,
      active: editing.value.active,
    })
    const idx = list.value.findIndex(a => a.id === updated.id)
    if (idx !== -1) list.value[idx] = updated
    editing.value = null
  } catch (e) {
    loadError.value = e.message ?? '儲存失敗'
  }
}

// --- Delete ---
const confirmDelete = ref(null)
function askDelete(id) { confirmDelete.value = id }
async function doDelete() {
  try {
    await api.delete(`/accounts/${confirmDelete.value}`)
    list.value = list.value.filter(a => a.id !== confirmDelete.value)
  } catch (e) {
    loadError.value = e.message ?? '刪除失敗'
  } finally {
    confirmDelete.value = null
  }
}

// --- Add modal ---
const addOpen = ref(false)
const addForm = ref({ username: '', password: '', role: 'viewer', teacher_id: '', active: true })
const addError = ref('')

function openAdd() {
  addForm.value = { username: '', password: '', role: 'viewer', teacher_id: '', active: true }
  addError.value = ''
  addOpen.value = true
}

async function submitAdd() {
  const username = addForm.value.username.trim()
  if (!username) { addError.value = '請填寫帳號 ID'; return }
  if (!addForm.value.password) { addError.value = '請填寫密碼'; return }
  try {
    const created = await api.post('/accounts', {
      username,
      password: addForm.value.password,
      role: addForm.value.role,
      teacher_id: addForm.value.teacher_id || null,
      active: addForm.value.active,
    })
    list.value.push(created)
    addOpen.value = false
  } catch (e) {
    addError.value = e.message ?? '新增失敗'
  }
}
</script>

<template>
  <AppLayout>
    <!-- No permission -->
    <div v-if="!auth.isAdmin"
         class="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#2a3347] flex items-center justify-center">
        <ShieldOff class="w-6 h-6 text-slate-600 dark:text-slate-400" />
      </div>
      <p class="font-semibold text-slate-700 dark:text-slate-300">無存取權限</p>
      <p class="text-sm text-slate-600 dark:text-slate-400">此頁面僅限 Super Admin 使用</p>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="space-y-3 mb-5">
        <div>
          <h2 class="font-bold text-slate-800 dark:text-slate-100">帳號管理</h2>
          <p class="text-xs text-slate-600 mt-0.5 dark:text-slate-400">共 {{ list.length }} 個帳號</p>
        </div>
        <button
          @click="openAdd"
          class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
                 btn-primary "
        >
          <UserPlus class="w-4 h-4" />
          新增帳號
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white dark:bg-[#161b27] rounded-xl border border-slate-200 dark:border-[#2a3347] overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-100 dark:border-[#2a3347] text-xs text-slate-600 dark:text-slate-400">
              <th class="text-left px-4 py-3 font-medium">帳號 ID</th>
              <th class="text-left px-4 py-3 font-medium">角色</th>
              <th class="text-left px-4 py-3 font-medium">關聯教師</th>
              <th class="text-left px-4 py-3 font-medium">狀態</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="acc in list"
              :key="acc.id"
              class="border-b border-slate-50 dark:border-[#1e2535] last:border-0
                     hover:bg-slate-50 dark:hover:bg-[#1a2235] transition-colors"
            >
              <!-- View mode -->
              <template v-if="!editing || editing.id !== acc.id">
                <td class="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">{{ acc.username }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
                        :class="roleColor(acc.role)">
                    <component :is="roleIcon(acc.role)" class="w-3 h-3" />
                    {{ roleLabel(acc.role) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">{{ teacherName(acc.teacher_id) }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center gap-1 text-xs font-medium"
                        :class="acc.active ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'">
                    <span class="w-1.5 h-1.5 rounded-full"
                          :class="acc.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'"></span>
                    {{ acc.active ? '啟用' : '停用' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    <button
                      @click="startEdit(acc)"
                      class="px-2.5 py-1 rounded-md text-xs text-slate-600 dark:text-slate-400
                             hover:bg-slate-100 dark:hover:bg-[#2a3347] hover:text-blue-600 dark:hover:text-cyan-400
                             transition-colors cursor-pointer"
                    >編輯</button>
                    <button
                      @click="askDelete(acc.id)"
                      class="p-1.5 rounded-md text-slate-600
                             hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400
                             transition-colors cursor-pointer dark:text-slate-400"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </template>

              <!-- Edit mode -->
              <template v-else>
                <td class="px-4 py-2">
                  <input
                    v-model="editing.username"
                    type="text"
                    class="w-full px-2 py-1 text-xs font-mono rounded border outline-none
                           bg-slate-50 dark:bg-[#0f1117]
                           border-slate-200 dark:border-[#2a3347]
                           text-slate-800 dark:text-slate-200
                           focus:border-blue-400 dark:focus:border-cyan-400"
                  />
                </td>
                <td class="px-4 py-2">
                  <select
                    v-model="editing.role"
                    class="px-2 py-1 text-xs rounded border outline-none cursor-pointer
                           bg-slate-50 dark:bg-[#0f1117]
                           border-slate-200 dark:border-[#2a3347]
                           text-slate-700 dark:text-slate-200
                           focus:border-blue-400 dark:focus:border-cyan-400"
                  >
                    <option v-for="r in ROLES" :key="r" :value="r">{{ roleLabel(r) }}</option>
                  </select>
                </td>
                <td class="px-4 py-2">
                  <select
                    v-model="editing.teacher_id"
                    class="px-2 py-1 text-xs rounded border outline-none cursor-pointer
                           bg-slate-50 dark:bg-[#0f1117]
                           border-slate-200 dark:border-[#2a3347]
                           text-slate-700 dark:text-slate-200
                           focus:border-blue-400 dark:focus:border-cyan-400"
                  >
                    <option value="">— 無 —</option>
                    <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </td>
                <td class="px-4 py-2">
                  <label class="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" v-model="editing.active" class="rounded cursor-pointer" />
                    <span class="text-xs text-slate-600 dark:text-slate-400">啟用</span>
                  </label>
                </td>
                <td class="px-4 py-2">
                  <div class="flex items-center gap-1">
                    <button
                      @click="saveEdit"
                      class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer
                             btn-primary transition-colors"
                    >
                      <Save class="w-3 h-3" />儲存
                    </button>
                    <button
                      @click="cancelEdit"
                      class="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 dark:hover:bg-[#2a3347] transition-colors cursor-pointer dark:text-slate-400"
                    >
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </template>
            </tr>

            <tr v-if="list.length === 0">
              <td colspan="5" class="px-4 py-10 text-center text-sm text-slate-600 dark:text-slate-400">尚無任何帳號</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Delete confirm dialog -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0" enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100" leave-to-class="opacity-0"
    >
      <div v-if="confirmDelete"
           class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-white dark:bg-[#1a2235] rounded-2xl border border-slate-200 dark:border-[#2a3347]
                    shadow-xl p-6 w-80 flex flex-col gap-4">
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
              <Trash2 class="w-4 h-4 text-red-700 dark:text-red-400" />
            </div>
            <div>
              <p class="font-semibold text-slate-800 dark:text-slate-100 text-sm">確認刪除帳號？</p>
              <p class="text-xs text-slate-600 mt-1 dark:text-slate-400">此操作無法復原。</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="confirmDelete = null"
              class="px-4 py-2 text-xs rounded-lg border cursor-pointer
                     border-slate-200 dark:border-[#2a3347] text-slate-600 dark:text-slate-400
                     hover:bg-slate-50 dark:hover:bg-[#2a3347] transition-colors"
            >取消</button>
            <button
              @click="doDelete"
              class="px-4 py-2 text-xs rounded-lg font-medium cursor-pointer
                     bg-red-600 text-white hover:bg-red-700 transition-colors"
            >刪除</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Add account modal -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0" enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100" leave-to-class="opacity-0"
    >
      <div v-if="addOpen"
           class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-white dark:bg-[#1a2235] rounded-2xl border border-slate-200 dark:border-[#2a3347]
                    shadow-xl p-6 w-96 flex flex-col gap-5">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm">新增帳號</h3>
            <button @click="addOpen = false"
                    class="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer
                           text-slate-600 hover:bg-slate-100 dark:hover:bg-[#2a3347] transition-colors dark:text-slate-400">
              <X class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="submitAdd" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-slate-600 dark:text-slate-400">
                帳號 ID <span class="text-red-700 dark:text-red-400">*</span>
              </label>
              <input
                v-model="addForm.username"
                type="text"
                placeholder="例如：teacher_chen"
                class="w-full px-3 py-2 text-sm font-mono rounded-lg border outline-none transition-colors
                       bg-slate-50 dark:bg-[#0f1117]
                       border-slate-200 dark:border-[#2a3347]
                       text-slate-800 dark:text-slate-200
                       placeholder-slate-500 dark:placeholder-slate-600
                       focus:border-blue-400 dark:focus:border-cyan-400"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-slate-600 dark:text-slate-400">
                密碼 <span class="text-red-700 dark:text-red-400">*</span>
              </label>
              <input
                v-model="addForm.password"
                type="password"
                autocomplete="new-password"
                placeholder="請設定初始密碼"
                class="w-full px-3 py-2 text-sm rounded-lg border outline-none transition-colors
                       bg-slate-50 dark:bg-[#0f1117]
                       border-slate-200 dark:border-[#2a3347]
                       text-slate-800 dark:text-slate-200
                       placeholder-slate-500 dark:placeholder-slate-600
                       focus:border-blue-400 dark:focus:border-cyan-400"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-slate-600 dark:text-slate-400">角色</label>
                <select
                  v-model="addForm.role"
                  class="px-3 py-2 text-sm rounded-lg border outline-none cursor-pointer
                         bg-slate-50 dark:bg-[#0f1117]
                         border-slate-200 dark:border-[#2a3347]
                         text-slate-700 dark:text-slate-200
                         focus:border-blue-400 dark:focus:border-cyan-400"
                >
                  <option v-for="r in ROLES" :key="r" :value="r">{{ roleLabel(r) }}</option>
                </select>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-slate-600 dark:text-slate-400">關聯教師</label>
                <select
                  v-model="addForm.teacher_id"
                  class="px-3 py-2 text-sm rounded-lg border outline-none cursor-pointer
                         bg-slate-50 dark:bg-[#0f1117]
                         border-slate-200 dark:border-[#2a3347]
                         text-slate-700 dark:text-slate-200
                         focus:border-blue-400 dark:focus:border-cyan-400"
                >
                  <option value="">— 無 —</option>
                  <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
              </div>
            </div>

            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" v-model="addForm.active" class="rounded cursor-pointer" />
              <span class="text-sm text-slate-600 dark:text-slate-300">立即啟用</span>
            </label>

            <p v-if="addError" class="text-xs text-red-700 dark:text-red-400">{{ addError }}</p>

            <div class="flex gap-2 pt-1">
              <button
                type="button"
                @click="addOpen = false"
                class="px-4 py-2 text-xs rounded-lg border cursor-pointer
                       border-slate-200 dark:border-[#2a3347] text-slate-600 dark:text-slate-400
                       hover:bg-slate-50 dark:hover:bg-[#2a3347] transition-colors"
              >取消</button>
              <button
                type="submit"
                class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium cursor-pointer
                       btn-primary transition-colors"
              >
                <UserPlus class="w-3.5 h-3.5" />
                新增
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </AppLayout>
</template>
