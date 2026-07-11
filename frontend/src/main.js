import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { usePermissionsStore } from '@/stores/permissions'

const auth = useAuthStore()
const perms = usePermissionsStore()
useThemeStore() // initialise dark mode before mount
// Load auth + page permissions in parallel. perms.load() never rejects (it
// falls back to defaults on failure), so a failed permission fetch can't block mount.
Promise.all([auth.init(), perms.load()]).then(() => app.mount('#app'))
