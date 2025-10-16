export const useRequestsStore = defineStore('requests', () => {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const user = ref(null)
  const token = ref(null)

  // инициализация токена из localStorage
  if (process.client) {
    token.value = localStorage.getItem('token')
    console.log('[init] token from LS =', token.value)
  }

  const { public: { apiBase } } = useRuntimeConfig()

  // --- хелперы ---
  function setToken(t) {
    token.value = t || null
    if (process.client) {
      if (t) localStorage.setItem('token', t)
      else localStorage.removeItem('token')
    }
  }
  function setUser(u) { user.value = u || null }
  function clearAuth() { user.value = null; setToken(null) }

  function bearerAuth() {
    // именно Bearer <token>, как в swagger-е
    return token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }

  // --- API вызовы ---
  const getData = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch(`${apiBase}/doctors`, {
        method: 'GET',
        query: params,
        headers: bearerAuth(),
      })
      data.value = res
      return res
    } catch (e) {
      error.value = e?.data?.message || e?.message || 'Ошибка загрузки данных'
      throw e
    } finally {
      loading.value = false
    }
  }

  const postLogin = async (payload) => {
    const res = await $fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      body: payload,
    })
    if (res?.token) setToken(res.token)
    if (res?.user) setUser(res.user)
    return res
  }

  const getMe = async () => {
    if (!token.value) throw new Error('Нет токена')
    const res = await $fetch(`${apiBase}/auth/me`, {
      method: 'GET',
      headers: bearerAuth(), // 🔹 сюда добавляем Authorization: Bearer ...
    })
    setUser(res)
    return res
  }

  return {
    data, loading, error,
    user, token,
    setToken, setUser, clearAuth,
    getData, postLogin, getMe,
  }
})
