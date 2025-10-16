export const useRequestsStore = defineStore('requests', () => {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const auth = useAuthStore() 

  const getData = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const { public: { apiBase } } = useRuntimeConfig()
      const res = await $fetch(`${apiBase}/doctors`, {
        method: 'GET',
        query: params,
        headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
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
    const { public: { apiBase } } = useRuntimeConfig()
    return $fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      body: payload,
    })
  }

  const getMe = async () => {
    const { public: { apiBase } } = useRuntimeConfig()
    const auth = useAuthStore()
    return $fetch(`${apiBase}/auth/me`, {
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
    })
  }

  return { data, loading, error, getData, postLogin, getMe }
})
