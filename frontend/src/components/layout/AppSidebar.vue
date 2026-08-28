<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore } from '@/stores/permissions'
import SidebarGroup from './SidebarGroup.vue'
import SidebarItem from './SidebarItem.vue'
import {
  Search, Users, LayoutList, RefreshCw,
  UserMinus, FolderCog, ListOrdered, FileInput, FileOutput, FileStack, Database, FolderOpen, History, User, KeyRound, Settings, ShieldCheck, GraduationCap, ChevronLeft, ChevronRight, ClipboardCheck
} from 'lucide-vue-next'

const auth = useAuthStore()
const perms = usePermissionsStore()
const collapsed = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('sidebar-collapsed')
  if (saved !== null) collapsed.value = saved === 'true'
})

function toggleCollapse() {
  collapsed.value = !collapsed.value
  localStorage.setItem('sidebar-collapsed', collapsed.value)
}
</script>

<template>
  <aside
    class="flex flex-col border-r transition-all duration-150 flex-shrink-0
           bg-white dark:bg-[#161b27]
           border-slate-200 dark:border-[#2a3347]"
    :class="collapsed ? 'w-14' : 'w-56'"
  >
    <!-- Logo -->
    <div class="flex items-center gap-3 px-3 h-14 border-b border-slate-200 dark:border-[#2a3347]">
      <GraduationCap class="w-5 h-5 text-blue-700 dark:text-cyan-400 flex-shrink-0" />
      <span
        class="font-bold text-blue-700 dark:text-cyan-400 text-sm tracking-wide transition-all duration-150"
        :class="collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'"
      >畢業專題</span>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1">
      <SidebarGroup label="瀏覽" :icon="Search" :collapsed="collapsed">
        <SidebarItem v-if="perms.canAccess('students', auth.role)" to="/students" label="學生列表" :icon="Users" :collapsed="collapsed" />
        <SidebarItem v-if="perms.canAccess('groups', auth.role)" to="/groups" label="組別列表" :icon="LayoutList" :collapsed="collapsed" />
      </SidebarGroup>

      <SidebarGroup
        v-if="perms.canAccess('remove-student', auth.role) || perms.canAccess('group-change', auth.role) || perms.canAccess('group-order', auth.role)"
        label="基本操作" :icon="RefreshCw" :collapsed="collapsed"
      >
        <SidebarItem v-if="perms.canAccess('remove-student', auth.role)" to="/changes/remove-student" label="學生更動" :icon="UserMinus" :collapsed="collapsed" />
        <SidebarItem v-if="perms.canAccess('group-change', auth.role)" to="/changes/group-change" label="組別異動" :icon="FolderCog" :collapsed="collapsed" />
        <SidebarItem v-if="perms.canAccess('group-order', auth.role)" to="/groups/order" label="組別排序" :icon="ListOrdered" :collapsed="collapsed" />
      </SidebarGroup>

      <SidebarGroup
        v-if="perms.canAccess('documents', auth.role) || perms.canAccess('documents-export', auth.role)"
        label="文件" :icon="FileStack" :collapsed="collapsed"
      >
        <SidebarItem v-if="perms.canAccess('documents', auth.role)" to="/documents" label="文件輸入" :icon="FileInput" :collapsed="collapsed" />
        <SidebarItem v-if="perms.canAccess('documents-export', auth.role)" to="/documents/export" label="文件輸出" :icon="FileOutput" :collapsed="collapsed" />
      </SidebarGroup>

      <SidebarGroup v-if="perms.canAccess('reviews', auth.role)" label="審查" :icon="ClipboardCheck" :collapsed="collapsed">
        <SidebarItem to="/reviews" label="審查評分" :icon="ClipboardCheck" :collapsed="collapsed" />
      </SidebarGroup>

      <SidebarGroup v-if="perms.canAccess('data', auth.role) || perms.canAccess('audit-logs', auth.role)" label="資料" :icon="Database" :collapsed="collapsed">
        <SidebarItem v-if="perms.canAccess('data', auth.role)" to="/data" label="資料管理" :icon="FolderOpen" :collapsed="collapsed" />
        <SidebarItem v-if="perms.canAccess('audit-logs', auth.role)" to="/audit-logs" label="異動紀錄" :icon="History" :collapsed="collapsed" />
      </SidebarGroup>

      <!-- 修改密碼不受權限設定管控：登入後人人可用 -->
      <SidebarGroup v-if="auth.isLoggedIn" label="帳號" :icon="User" :collapsed="collapsed">
        <SidebarItem to="/password" label="修改密碼" :icon="KeyRound" :collapsed="collapsed" />
        <SidebarItem v-if="auth.isAdmin" to="/accounts" label="帳號管理" :icon="Settings" :collapsed="collapsed" />
        <SidebarItem v-if="auth.isAdmin" to="/permissions" label="權限設定" :icon="ShieldCheck" :collapsed="collapsed" />
      </SidebarGroup>
    </nav>

    <!-- Collapse toggle -->
    <button
      @click="toggleCollapse"
      class="flex items-center justify-center h-10 border-t border-slate-200 dark:border-[#2a3347]
             text-slate-600 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400
             transition-colors text-sm cursor-pointer"
    >
      <ChevronLeft v-if="!collapsed" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>
  </aside>
</template>
