// stores/auth.js
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null) // { id, name, email, avatar, ... }

  function setUser(payload) {
    user.value = payload
  }
  function clearUser() {
    user.value = null
  }

  // удобный экшен для /auth/me
  const fetchMe = async () => {
    const { public: { apiBase } } = useRuntimeConfig()
    try {
      const me = await $fetch(`${apiBase}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      })
      setUser(me)
      return me
    } catch (e) {
      clearUser()
      throw e
    }
  }

  return { user, setUser, clearUser, fetchMe }
})
