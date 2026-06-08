import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/students' },
  { path: '/students', name: 'Students', component: () => import('@/views/StudentsView.vue') },
  { path: '/groups', name: 'Groups', component: () => import('@/views/GroupsView.vue') },
  { path: '/changes/remove-student', name: 'RemoveStudent', component: () => import('@/views/changes/RemoveStudentView.vue') },
  { path: '/changes/group-change', name: 'GroupChange', component: () => import('@/views/changes/GroupChangeView.vue') },
  { path: '/documents', name: 'Documents', component: () => import('@/views/DocumentsView.vue') },
  { path: '/data', name: 'Data', component: () => import('@/views/DataView.vue') },
  { path: '/audit-logs', name: 'AuditLogs', component: () => import('@/views/AuditLogView.vue') },
  { path: '/accounts', name: 'Accounts', component: () => import('@/views/AccountsView.vue') },
  { path: '/permissions', name: 'Permissions', component: () => import('@/views/PermissionsView.vue') },
  { path: '/about', name: 'About', component: () => import('@/views/AboutView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/students' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
