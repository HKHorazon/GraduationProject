<script setup>
import { GraduationCap } from 'lucide-vue-next'
import AppLayout from '@/components/layout/AppLayout.vue'
</script>

<template>
  <AppLayout>
    <div class="max-w-2xl mx-auto">
      <div class="rounded-xl border border-slate-200 dark:border-[#2a3347]
                  bg-white dark:bg-[#161b27] p-8">
        <div class="flex items-center gap-3 mb-6">
          <GraduationCap class="w-7 h-7 text-blue-600 dark:text-cyan-400" />
          <h1 class="text-lg font-bold text-blue-600 dark:text-cyan-400 tracking-wide">弘光多遊系畢業專題</h1>
        </div>

        <div class="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            本系統供教師管理學生與畢業專題組別。多數使用者僅能瀏覽，少數編輯者可進行異動。
          </p>
          <dl class="grid grid-cols-[6rem_1fr] gap-y-2 pt-2 border-t border-slate-100 dark:border-[#2a3347]">
            <dt class="text-slate-400 dark:text-slate-500">系統名稱</dt>
            <dd>弘光多遊系畢業專題管理系統</dd>
            <dt class="text-slate-400 dark:text-slate-500">前端</dt>
            <dd>Vue 3 + Vite + TailwindCSS</dd>
            <dt class="text-slate-400 dark:text-slate-500">後端</dt>
            <dd>FastAPI + PostgreSQL</dd>
          </dl>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
