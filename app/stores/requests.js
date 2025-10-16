// stores/requests.js
export const useRequestsStore = defineStore('requests', () => {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const getData = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const { public: { apiBase } } = useRuntimeConfig()
      const res = await $fetch(`${apiBase}/doctors`, {
        method: 'GET',
        query: params,
        credentials: 'include',
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

  // 👇 POST /auth/login
  const postLogin = async (payload) => {
    const { public: { apiBase } } = useRuntimeConfig()
    return $fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      body: payload,
      credentials: 'include',
    })
  }

  // 👇 GET /auth/me
  const getMe = async () => {
    const { public: { apiBase } } = useRuntimeConfig()
    return $fetch(`${apiBase}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    })
  }

  return { data, loading, error, getData, postLogin, getMe }
})
