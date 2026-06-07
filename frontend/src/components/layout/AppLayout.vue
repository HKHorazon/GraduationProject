<script setup>
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0f1117] text-slate-800 dark:text-slate-200">
    <AppSidebar />
    <div class="flex flex-col flex-1 min-w-0">
      <AppTopbar />
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
