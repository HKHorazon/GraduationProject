import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/students' },
  { path: '/students', name: 'Students', component: () => import('@/views/StudentsView.vue') },
  { path: '/groups', name: 'Groups', component: () => import('@/views/GroupsView.vue') },
  { path: '/changes/remove-student', name: 'RemoveStudent', component: () => import('@/views/changes/RemoveStudentView.vue') },
  { path: '/data', name: 'Data', component: () => import('@/views/DataView.vue') },
  { path: '/accounts', name: 'Accounts', component: () => import('@/views/AccountsView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/students' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
