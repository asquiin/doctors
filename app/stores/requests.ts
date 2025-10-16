import { defineStore } from 'pinia'

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface DoctorSlot {
  id: string
  startTime: string
  endTime: string
}

export interface Doctor {
  id: string
  name: string
  specialty: string
  rating?: number
  reviewCount?: number
  experience?: number
  price?: number
  avatar?: string
  education?: string
  description?: string
  achievements?: string[]
  todaySlots?: DoctorSlot[]
}

export interface DoctorsResponse {
  doctors: Doctor[]
  pagination: Pagination
}

export type AnyResponse = unknown

export const useRequestsStore = defineStore('requests', () => {
  const data = ref<AnyResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const user = ref<any | null>(null)
  const token = ref<string | null>(null)

  if (process.client) {
    token.value = localStorage.getItem('token')
  }

  const { public: { apiBase } } = useRuntimeConfig()

  function setToken(t?: string | null) {
    token.value = t || null
    if (process.client) {
      if (t) localStorage.setItem('token', t)
      else localStorage.removeItem('token')
    }
  }
  function setUser(u?: any | null) { user.value = u || null }
  function clearAuth() { user.value = null; setToken(null) }

  function bearerAuth(): Record<string, string> {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }

  const postLogin = async (payload: { email: string; password: string }) => {
    const res = await $fetch<{ success?: boolean; token?: string; user?: any }>(
      `${apiBase}/auth/login`,
      { method: 'POST', body: payload }
    )
    if (res?.token) setToken(res.token)
    if (res?.user) setUser(res.user)
    return res
  }

 const getData = async <T = AnyResponse>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T> => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<T>(`${apiBase}${endpoint}`, {
        method: 'GET',
        query: params,
        headers: bearerAuth(),
      })
      data.value = res as AnyResponse
      return res
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || 'Ошибка загрузки данных'
      error.value = msg
      throw e
    } finally {
      loading.value = false
    }
  }

 const postData = async <T = AnyResponse>(
    endpoint: string,
    body?: any,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST'
  ): Promise<T> => {
    try {
      const headers = bearerAuth()
      const res = await $fetch<T>(`${apiBase}${endpoint}`, {
        method,
        body,
        headers,
      })
      return res
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || 'Ошибка запроса'
      throw new Error(msg)
    }
  }


  return {
    data, loading, error,
    user, token,

    setToken, setUser, clearAuth,
    getData, postLogin, postData
  }
})
