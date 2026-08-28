<script setup>
// 頁面層級的「沒有權限」畫面。原本這段在 6 個 view 各抄了一份，而且寫死看
// auth.isEditor —— 就是權限設定給了權限卻進不去的原因。現在一律問權限表。
import { ShieldOff } from 'lucide-vue-next'

defineProps({
  title: { type: String, default: '無存取權限' },
  hint: { type: String, default: '此頁面未開放給你所屬的權限分組，請洽系統管理員' },
})
</script>

<template>
  <div class="flex flex-col items-center justify-center h-64 gap-3 text-center">
    <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-dark-border flex items-center justify-center">
      <ShieldOff class="w-6 h-6 text-slate-600 dark:text-slate-400" />
    </div>
    <p class="font-semibold text-slate-700 dark:text-slate-300">{{ title }}</p>
    <p class="text-sm text-slate-600 dark:text-slate-400">{{ hint }}</p>
  </div>
</template>
