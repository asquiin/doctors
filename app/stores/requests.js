// stores/requests.js
export const useRequestsStore = defineStore('requests', () => {
  // --- общий стейт ---
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const user = ref(null)
  const token = ref(null)

  // инициализация токена из localStorage на клиенте
  if (process.client) {
    const fromLS = localStorage.getItem('token')
    token.value = fromLS
    console.log('[init] token from localStorage =', fromLS)
  }

  // --- утилиты для auth ---
  function setToken(t) {
    console.log('[setToken] incoming =', t)
    token.value = t || null
    if (process.client) {
      if (t) {
        localStorage.setItem('token', t)
        console.log('[setToken] saved to LS =', localStorage.getItem('token'))
      } else {
        localStorage.removeItem('token')
        console.log('[setToken] removed from LS')
      }
    }
  }
  function setUser(u) {
    user.value = u || null
    console.log('[setUser] user =', user.value)
  }
  function clearAuth() {
    setUser(null)
    setToken(null)
  }
  function authHeaders() {
    const h = token.value ? { Authorization: `Bearer ${token.value}` } : {}
    // console.log('[authHeaders]', h)
    return h
  }

  // --- API base ---
  const { public: { apiBase } } = useRuntimeConfig()

  // --- запрос списка врачей ---
  const getData = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch(`${apiBase}/doctors`, {
        method: 'GET',
        query: params,
        headers: authHeaders(),
      })
      data.value = res
      return res
    } catch (e) {
      error.value = e?.data?.message || e?.message || 'Ошибка загрузки данных'
      console.error('[getData] error =', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // --- авторизация: POST /auth/login -> { success, token, user } ---
  const postLogin = async (payload) => {
    console.log('[postLogin] payload =', payload)
    try {
      const res = await $fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        body: payload,
      })
      console.log('[postLogin] raw response =', res)

      // бэки иногда возвращают строку -> пробуем распарсить
      const obj = typeof res === 'string' ? JSON.parse(res) : res

      const gotToken =
        obj?.token ??
        obj?.data?.token ??           // на всякий случай
        null

      const gotUser =
        obj?.user ??
        obj?.data?.user ??            // на всякий случай
        null

      if (!gotToken) {
        console.warn('[postLogin] no token in response')
      } else {
        setToken(gotToken)
      }
      if (gotUser) setUser(gotUser)

      console.log('[postLogin] token.value =', token.value, ' | LS =', process.client ? localStorage.getItem('token') : null)
      return obj
    } catch (e) {
      console.error('[postLogin] error =', e)
      throw e
    }
  }

  // --- профиль по токену: GET /auth/me ---
  const getMe = async () => {
    if (!token.value) {
      console.warn('[getMe] no token,  abort')
      throw new Error('Нет токена')
    }
    console.log('[getMe] using token =', token.value)
    const me = await $fetch(`${apiBase}/auth/me`, {
      headers: authHeaders(),
    })
    setUser(me)
    return me
  }

  // Вспомогательно: быстрый дамп в консоль
  function dumpAuth() {
    console.log('[dumpAuth] token =', token.value, '| user =', user.value, '| LS =', process.client ? localStorage.getItem('token') : null)
  }

  return {
    // состояния
    data, loading, error,
    user, token,

    // утилиты
    setToken, setUser, clearAuth, dumpAuth,

    // api
    getData, postLogin, getMe,
  }
})
