<script setup>
// 組別連動入口：顯示組別（名稱或「第 N 組」）時用這個元件。
// 編輯者點擊後進入 組別異動 並自動選取該組；其他人看到純文字。
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore } from '@/stores/permissions'

const props = defineProps({
  // 完整組別物件（優先），或只傳 id + label
  group: { type: Object, default: null },
  id: { type: String, default: '' },
  // 顯示文字；未提供時顯示組別名稱
  label: { type: String, default: '' },
})

const auth = useAuthStore()
const perms = usePermissionsStore()

const targetId = computed(() => props.group?.id ?? props.id)
const display = computed(() => props.label || props.group?.name || targetId.value)
const clickable = computed(() => perms.canEdit('groups', auth.role) && !!targetId.value)
</script>

<template>
  <RouterLink
    v-if="clickable"
    :to="{ path: '/changes/group-change', query: { group: targetId } }"
    class="cursor-pointer transition-colors underline-offset-2 decoration-dotted
           hover:underline hover:text-blue-600 dark:hover:text-cyan-400"
    :title="`組別異動：${display}`"
    @click.stop
  >{{ display }}</RouterLink>
  <span v-else>{{ display }}</span>
</template>
