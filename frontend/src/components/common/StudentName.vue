<script setup>
// 連動 + 個資混淆的單一入口：所有頁面顯示學生姓名一律用這個元件。
// - 編輯者：姓名可點，進入 學生更動 並自動選取該學生
// - 未登入：姓名混淆顯示（張O明）
// - 其他（viewer）：純文字
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { maskName } from '@/lib/privacy'

const props = defineProps({
  // 完整學生物件（優先），或分開傳 name + id
  student: { type: Object, default: null },
  name: { type: String, default: '' },
  id: { type: String, default: '' },
  // 顯示文字覆寫（例如「王大明（A11001）」）；混淆時仍以 name 為基準
  label: { type: String, default: '' },
})

const auth = useAuthStore()

const rawName = computed(() => props.student?.name ?? props.name)
const targetId = computed(() => props.student?.id ?? props.id)

const display = computed(() => {
  if (!auth.isLoggedIn) return maskName(rawName.value)
  return props.label || rawName.value
})

const clickable = computed(() => auth.isEditor && !!targetId.value)
</script>

<template>
  <RouterLink
    v-if="clickable"
    :to="{ path: '/changes/remove-student', query: { student: targetId } }"
    class="cursor-pointer transition-colors underline-offset-2 decoration-dotted
           hover:underline hover:text-blue-600 dark:hover:text-cyan-400"
    :title="`學生更動：${rawName}`"
    @click.stop
  >{{ display }}</RouterLink>
  <span v-else>{{ display }}</span>
</template>
