import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'

// Single source of truth for domain data. Views read these refs and call the
// actions below, which hit the FastAPI backend and keep local state in sync.
export const useDataStore = defineStore('data', () => {
  const students = ref([])
  const groups = ref([])
  const teachers = ref([])
  const reviews = ref([])          // 審查場次
  const scores = ref([])           // 目前選取審查的評分（loadScores 之後才有值）
  const scoresReviewId = ref('')
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref('')

  async function loadAll() {
    if (loading.value) return
    loading.value = true
    error.value = ''
    try {
      const [s, g, t, r] = await Promise.all([
        api.get('/students'),
        api.get('/groups'),
        api.get('/teachers'),
        api.get('/reviews'),
      ])
      students.value = s
      groups.value = g
      teachers.value = t
      reviews.value = r
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

  async function reorderGroups(schoolYear, orderedIds) {
    const updated = await api.post('/groups/reorder', {
      school_year: schoolYear,
      ordered_ids: orderedIds,
    })
    const byId = Object.fromEntries(updated.map((g) => [g.id, g]))
    groups.value = groups.value.map((g) => byId[g.id] ?? g)
    return updated
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

  // --- 審查評分 ---
  // 評分是單一審查場次的資料量，只在進入該審查時載入，不塞進 loadAll。
  async function loadScores(reviewId) {
    scores.value = await api.get(`/reviews/${reviewId}/scores`)
    scoresReviewId.value = reviewId
    return scores.value
  }

  function _mergeScore(row) {
    const idx = scores.value.findIndex((s) => s.id === row.id)
    if (idx === -1) scores.value.push(row)
    else scores.value[idx] = row
  }

  async function createReview(payload) {
    const created = await api.post('/reviews', payload)
    reviews.value.push(created)
    return created
  }

  async function updateReview(id, patch) {
    const updated = await api.patch(`/reviews/${id}`, patch)
    const idx = reviews.value.findIndex((r) => r.id === id)
    if (idx !== -1) reviews.value[idx] = updated
    return updated
  }

  async function deleteReview(id) {
    await api.delete(`/reviews/${id}`)
    reviews.value = reviews.value.filter((r) => r.id !== id)
    if (scoresReviewId.value === id) scores.value = []
  }

  async function putScore(reviewId, payload) {
    const row = await api.put(`/reviews/${reviewId}/scores`, payload)
    _mergeScore(row)
    return row
  }

  async function importScores(reviewId, rows) {
    const saved = await api.post(`/reviews/${reviewId}/scores/bulk`, rows)
    saved.forEach(_mergeScore)
    return saved
  }

  async function deleteScore(reviewId, scoreId) {
    await api.delete(`/reviews/${reviewId}/scores/${scoreId}`)
    scores.value = scores.value.filter((s) => s.id !== scoreId)
  }

  return {
    students,
    groups,
    teachers,
    reviews,
    scores,
    scoresReviewId,
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
    reorderGroups,
    deleteGroup,
    loadScores,
    createReview,
    updateReview,
    deleteReview,
    putScore,
    importScores,
    deleteScore,
  }
})
