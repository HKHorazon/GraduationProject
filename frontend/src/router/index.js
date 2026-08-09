import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/students' },
  { path: '/students', name: 'Students', component: () => import('@/views/StudentsView.vue') },
  { path: '/groups', name: 'Groups', component: () => import('@/views/GroupsView.vue') },
  { path: '/groups/order', name: 'GroupOrder', component: () => import('@/views/GroupOrderView.vue') },
  { path: '/changes/remove-student', name: 'RemoveStudent', component: () => import('@/views/changes/RemoveStudentView.vue') },
  { path: '/changes/group-change', name: 'GroupChange', component: () => import('@/views/changes/GroupChangeView.vue') },
  { path: '/documents', name: 'Documents', component: () => import('@/views/DocumentsView.vue') },
  { path: '/documents/export', name: 'DocumentsExport', component: () => import('@/views/DocumentsExportView.vue') },
  { path: '/reviews', name: 'Reviews', component: () => import('@/views/ReviewsView.vue') },
  { path: '/data', name: 'Data', component: () => import('@/views/DataView.vue') },
  { path: '/audit-logs', name: 'AuditLogs', component: () => import('@/views/AuditLogView.vue') },
  { path: '/accounts', name: 'Accounts', component: () => import('@/views/AccountsView.vue') },
  { path: '/permissions', name: 'Permissions', component: () => import('@/views/PermissionsView.vue') },
  { path: '/about', name: 'About', component: () => import('@/views/AboutView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/students' },
]

const router = createRouter({
  // base 必須跟 vite.config.js 的 base 一致，否則網址會掉前綴、
  // 重新整理/深層連結會 404
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
