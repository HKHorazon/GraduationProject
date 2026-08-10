<script setup>
import { ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  label: { type: String, required: true },
  icon: { type: [Object, Function], required: true },
  collapsed: { type: Boolean, default: false },
})

// The sidebar remounts on every route change (each view renders its own
// AppLayout), so persist each group's open state keyed by label.
const storageKey = `sidebar-group:${props.label}`
const open = ref(localStorage.getItem(storageKey) !== 'false')
watch(open, (v) => localStorage.setItem(storageKey, v))
function toggle() { open.value = !open.value }
</script>

<template>
  <div class="mb-1">
    <button
      @click="toggle"
      class="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-widest
             text-slate-600 dark:text-slate-400
             hover:text-slate-700 dark:hover:text-slate-300
             transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a3347]/30
             cursor-pointer"
    >
      <component :is="icon" class="w-4 h-4 flex-shrink-0" />
      <span
        class="flex-1 text-left transition-all duration-150"
        :class="collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'"
      >{{ label }}</span>
      <ChevronDown
        v-if="!collapsed"
        class="w-3 h-3 text-slate-600 transition-transform duration-200 dark:text-slate-400"
        :class="open ? 'rotate-0' : '-rotate-90'"
      />
    </button>
    <div
      class="overflow-hidden transition-all duration-200"
      :class="open || collapsed ? 'max-h-96' : 'max-h-0'"
    >
      <div class="pl-2 mt-0.5 flex flex-col gap-0.5">
        <slot />
      </div>
    </div>
  </div>
</template>
