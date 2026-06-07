<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { MoreHorizontal } from 'lucide-vue-next'

defineProps({
  actions: {
    type: Array,
    default: () => []
    // [{ label: String, icon?: Component, danger?: Boolean, handler: Function, disabled?: Boolean }]
  }
})

const open = ref(false)
const wrapper = ref(null)

function toggle(e) {
  e.stopPropagation()
  open.value = !open.value
}

function run(action, e) {
  e.stopPropagation()
  if (action.disabled) return
  open.value = false
  action.handler()
}

function handleClickOutside(e) {
  if (open.value && wrapper.value && !wrapper.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div ref="wrapper" class="relative inline-block">
    <button
      @click="toggle"
      class="w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer
             text-slate-400 dark:text-slate-500
             hover:text-slate-600 dark:hover:text-slate-300
             hover:bg-slate-100 dark:hover:bg-[#2a3347]"
    >
      <MoreHorizontal class="w-4 h-4" />
    </button>

    <Transition
      enter-active-class="transition-all duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        class="absolute right-0 top-full mt-1 min-w-[140px] z-40 rounded-lg shadow-lg
               bg-white dark:bg-[#1a2235]
               border border-slate-200 dark:border-[#2a3347]
               py-1"
      >
        <button
          v-for="(action, i) in actions"
          :key="i"
          @click="run(action, $event)"
          :disabled="action.disabled"
          class="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
          :class="action.disabled
            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            : action.danger
              ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#2a3347] cursor-pointer'"
        >
          <component v-if="action.icon" :is="action.icon" class="w-3.5 h-3.5 flex-shrink-0" />
          {{ action.label }}
        </button>
        <div v-if="actions.length === 0" class="px-3 py-2 text-xs text-slate-400 dark:text-slate-600">
          暫無可用操作
        </div>
      </div>
    </Transition>
  </div>
</template>
