// stores/requests.ts
import { defineStore } from 'pinia'

/** ===== Типы API ===== */
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

/** Универсальный ответ, если эндпоинт другой */
export type AnyResponse = unknown

export const useRequestsStore = defineStore('requests', () => {
  // --- общий стейт ---
  const data = ref<AnyResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const user = ref<any | null>(null)
  const token = ref<string | null>(null)

  // init token из localStorage
  if (process.client) {
    token.value = localStorage.getItem('token')
    // console.log('[init] token from LS =', token.value)
  }

  const { public: { apiBase } } = useRuntimeConfig()

  // --- auth утилиты ---
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

  /**
   * Универсальный загрузчик:
   * @param endpoint относительный путь БЕЗ apiBase, например: '/doctors' или '/specialties'
   * @param params   query-параметры
   * @returns ответ как unknown (или кастуешь в странице)
   */
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

  /** Авторизация */
  const postLogin = async (payload: { email: string; password: string }) => {
    const res = await $fetch<{ success?: boolean; token?: string; user?: any }>(
      `${apiBase}/auth/login`,
      { method: 'POST', body: payload }
    )
    if (res?.token) setToken(res.token)
    if (res?.user) setUser(res.user)
    return res
  }

  /** Профиль */
  const getMe = async () => {
    if (!token.value) throw new Error('Нет токена')
    const res = await $fetch<any>(`${apiBase}/auth/me`, {
      method: 'GET',
      headers: bearerAuth(),
    })
    setUser(res)
    return res
  }

  return {
    // state
    data, loading, error,
    user, token,
    // auth utils
    setToken, setUser, clearAuth,
    // api
    getData, postLogin, getMe,
  }
})
