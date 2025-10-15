// stores/requests.js
export const useRequestsStore = defineStore('requests', () => {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const getData = async (params = {}) => {
    loading.value = true
    error.value = null

    try {
      // базовый URL можно хранить в nuxt.config.ts → runtimeConfig.public.apiBase
      const { public: { apiBase } } = useRuntimeConfig()

      // запрос
      const res = await $fetch(`${apiBase}/doctors`, {
        method: 'GET',
        query: params, // например { page: 1, sortBy: 'rating', sortOrder: 'desc' }
      })

      data.value = res
      return res
    } catch (e) {
      error.value = e?.data?.message || e?.message || 'Ошибка загрузки данных'
      console.error('getData error:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, getData }
})
