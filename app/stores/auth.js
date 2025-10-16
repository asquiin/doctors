// stores/auth.js
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = useCookie('token', { sameSite: 'lax' }) 

  function setUser(payload) { user.value = payload }
  function clearUser() { user.value = null; token.value = null }

  async function fetchMe() {
    const { public: { apiBase } } = useRuntimeConfig()
    if (!token.value) { clearUser(); throw new Error('No token') }
    const me = await $fetch(`${apiBase}/auth/me`, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    setUser(me)
    return me
  }

  return { user, token, setUser, clearUser, fetchMe }
})
