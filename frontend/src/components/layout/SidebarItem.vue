<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  to: { type: String, required: true },
  label: { type: String, required: true },
  icon: { type: [Object, Function], required: true },
  collapsed: { type: Boolean, default: false },
})

const route = useRoute()
const isActive = computed(() => route.path === props.to)
</script>

<template>
  <RouterLink
    :to="to"
    class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group relative cursor-pointer"
    :class="isActive
      ? 'bg-blue-50 dark:bg-cyan-900/20 text-blue-700 dark:text-cyan-400 font-semibold border border-blue-200 dark:border-cyan-800/50'
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2a3347]/50'"
  >
    <component :is="icon" class="w-4 h-4 flex-shrink-0" />
    <span
      class="truncate transition-all duration-150"
      :class="collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'"
    >{{ label }}</span>

    <!-- Tooltip when collapsed -->
    <span
      v-if="collapsed"
      class="absolute left-full ml-2 px-2 py-1 bg-white dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347] rounded text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg"
    >{{ label }}</span>

    <!-- Active indicator -->
    <span
      v-if="isActive"
      class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-600 dark:bg-cyan-400 rounded-full"
    />
  </RouterLink>
</template>
