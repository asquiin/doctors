export const useAuthStore = defineStore('auth', () => {
  const user = ref(null) 

  function setUser(payload) {
    user.value = payload
  }
  function clearUser() {
    user.value = null
  }

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
