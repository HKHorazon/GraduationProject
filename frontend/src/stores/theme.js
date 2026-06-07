import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // default to dark mode unless the user has explicitly chosen light
  const isDark = ref(localStorage.getItem('theme') !== 'light')

  function apply() {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  function toggle() {
    isDark.value = !isDark.value
  }

  watch(isDark, (val) => {
    localStorage.setItem('theme', val ? 'dark' : 'light')
    apply()
  })

  apply()

  return { isDark, toggle }
})
