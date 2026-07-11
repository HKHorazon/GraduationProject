import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'

// Single source of truth for domain data. Views read these refs and call the
// actions below, which hit the FastAPI backend and keep local state in sync.
export const useDataStore = defineStore('data', () => {
  const students = ref([])
  const groups = ref([])
  const teachers = ref([])
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref('')

  async function loadAll() {
    if (loading.value) return
    loading.value = true
    error.value = ''
    try {
      const [s, g, t] = await Promise.all([
        api.get('/students'),
        api.get('/groups'),
        api.get('/teachers'),
      ])
      students.value = s
      groups.value = g
      teachers.value = t
      loaded.value = true
    } catch (e) {
      error.value = e.message ?? '載入資料失敗'
    } finally {
      loading.value = false
    }
  }

  function _replaceStudent(updated) {
    const idx = students.value.findIndex((s) => s.id === updated.id)
    if (idx !== -1) students.value[idx] = updated
  }

  async function updateStudent(id, patch) {
    const updated = await api.patch(`/students/${id}`, patch)
    _replaceStudent(updated)
    return updated
  }

  async function createStudent(payload) {
    const created = await api.post('/students', payload)
    students.value.push(created)
    return created
  }

  async function bulkCreateStudents(rows) {
    const created = await api.post('/students/bulk', rows)
    students.value.push(...created)
    return created
  }

  async function createTeacher(name) {
    const created = await api.post('/teachers', { name })
    teachers.value.push(created)
    return created
  }

  async function deleteStudent(id) {
    await api.delete(`/students/${id}`)
    students.value = students.value.filter((s) => s.id !== id)
  }

  async function updateGroup(id, patch) {
    const updated = await api.patch(`/groups/${id}`, patch)
    const idx = groups.value.findIndex((g) => g.id === id)
    if (idx !== -1) groups.value[idx] = updated
    return updated
  }

  async function createGroup(payload) {
    const created = await api.post('/groups', payload)
    groups.value.push(created)
    return created
  }

  async function deleteGroup(id) {
    await api.delete(`/groups/${id}`)
    groups.value = groups.value.filter((g) => g.id !== id)
    // members of a deleted group are unassigned server-side (FK set null);
    // reflect that locally too
    students.value = students.value.map((s) =>
      s.group_id === id ? { ...s, group_id: null } : s
    )
  }

  return {
    students,
    groups,
    teachers,
    loaded,
    loading,
    error,
    loadAll,
    updateStudent,
    createStudent,
    bulkCreateStudents,
    createTeacher,
    deleteStudent,
    updateGroup,
    createGroup,
    deleteGroup,
  }
})
