<script setup>
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore } from '@/stores/permissions'
import SidebarGroup from './SidebarGroup.vue'
import SidebarItem from './SidebarItem.vue'
import {
  Search, Users, LayoutList, RefreshCw,
  UserMinus, FolderCog, FileText, FileStack, Database, FolderOpen, User, Settings, ShieldCheck, GraduationCap, Info, History
} from 'lucide-vue-next'

const auth = useAuthStore()
const perms = usePermissionsStore()
</script>

<template>
  <aside
    class="flex flex-col border-r flex-shrink-0 w-56
           bg-white dark:bg-[#161b27]
           border-slate-200 dark:border-[#2a3347]"
  >
    <!-- Logo -->
    <div class="flex items-center gap-3 px-3 h-14 border-b border-slate-200 dark:border-[#2a3347]">
      <GraduationCap class="w-5 h-5 text-blue-600 dark:text-cyan-400 flex-shrink-0" />
      <span class="font-bold text-blue-600 dark:text-cyan-400 text-sm tracking-wide">弘光多遊系畢業專題</span>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1">
      <SidebarGroup label="瀏覽" :icon="Search" :collapsed="false">
        <SidebarItem v-if="perms.canAccess('students', auth.role)" to="/students" label="學生列表" :icon="Users" :collapsed="false" />
        <SidebarItem v-if="perms.canAccess('groups', auth.role)" to="/groups" label="組別列表" :icon="LayoutList" :collapsed="false" />
      </SidebarGroup>

      <SidebarGroup
        v-if="perms.canAccess('remove-student', auth.role) || perms.canAccess('group-change', auth.role)"
        label="異動" :icon="RefreshCw" :collapsed="false"
      >
        <SidebarItem v-if="perms.canAccess('remove-student', auth.role)" to="/changes/remove-student" label="學生更動" :icon="UserMinus" :collapsed="false" />
        <SidebarItem v-if="perms.canAccess('group-change', auth.role)" to="/changes/group-change" label="組別異動" :icon="FolderCog" :collapsed="false" />
      </SidebarGroup>

      <SidebarGroup v-if="perms.canAccess('documents', auth.role)" label="文件處理" :icon="FileStack" :collapsed="false">
        <SidebarItem to="/documents" label="文件處理" :icon="FileText" :collapsed="false" />
      </SidebarGroup>

      <SidebarGroup v-if="perms.canAccess('data', auth.role) || perms.canAccess('audit-logs', auth.role)" label="資料" :icon="Database" :collapsed="false">
        <SidebarItem v-if="perms.canAccess('data', auth.role)" to="/data" label="資料管理" :icon="FolderOpen" :collapsed="false" />
        <SidebarItem v-if="perms.canAccess('audit-logs', auth.role)" to="/audit-logs" label="異動紀錄" :icon="History" :collapsed="false" />
      </SidebarGroup>

      <SidebarGroup v-if="auth.isSuperAdmin" label="帳號" :icon="User" :collapsed="false">
        <SidebarItem to="/accounts" label="帳號管理" :icon="Settings" :collapsed="false" />
        <SidebarItem to="/permissions" label="權限設定" :icon="ShieldCheck" :collapsed="false" />
      </SidebarGroup>
    </nav>

    <!-- About -->
    <RouterLink
      to="/about"
      class="flex items-center justify-center gap-2 h-10 border-t border-slate-200 dark:border-[#2a3347]
             text-slate-400 dark:text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400
             transition-colors text-sm cursor-pointer"
    >
      <Info class="w-4 h-4" />
      關於此系統
    </RouterLink>
  </aside>
</template>
