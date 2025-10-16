<!-- pages/login.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'default.vue' })

const router = useRouter()
const route = useRoute()

// локальный стейт формы
const email = ref('')
const password = ref('')
const showPass = ref(false)
const formError = ref<string | null>(null)
const submitting = ref(false)

// простая валидация
const emailValid = computed(() => /\S+@\S+\.\S+/.test(email.value))
const passValid  = computed(() => password.value.length >= 6)
const canSubmit  = computed(() => emailValid.value && passValid.value && !submitting.value)

// API base
const { public: { apiBase } } = useRuntimeConfig()

async function onSubmit() {
  if (!canSubmit.value) return
  submitting.value = true
  formError.value = null

  try {
    // POST /api/auth/login (с куки, если бэк ставит httpOnly cookie)
    await $fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      body: { email: email.value, password: password.value },
      credentials: 'include',
    })

    // подтянуть актуальные данные пользователя
    const me = await $fetch(`${apiBase}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    })
    // сохраним в pinia (см. пункт 2)
    const auth = useAuthStore()
    auth.setUser(me)

    // редирект: обратно или на /
    const redirect = (route.query.redirect as string) || '/'
    // если пришли со страницы врача/слота — вернёмся назад
    if (redirect === 'back') router.back()
    else router.push(redirect)
  } catch (e: any) {
    formError.value = e?.data?.message || e?.message || 'Не удалось авторизоваться'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-6">
    <div class="w-full max-w-md bg-white border rounded-2xl shadow p-6 space-y-6">
      <h1 class="text-2xl font-semibold text-center">Вход</h1>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <!-- Email -->
        <div>
          <label class="block text-sm mb-1">Email</label>
          <input
            v-model.trim="email"
            type="email"
            placeholder="you@example.com"
            class="w-full border rounded px-3 py-2"
          />
          <p v-if="email && !emailValid" class="text-xs text-red-600 mt-1">
            Неверный формат email
          </p>
        </div>

        <!-- Пароль -->
        <div>
          <label class="block text-sm mb-1">Пароль</label>
          <div class="flex">
            <input
              :type="showPass ? 'text' : 'password'"
              v-model="password"
              placeholder="Минимум 6 символов"
              class="flex-1 border rounded-l px-3 py-2"
            />
            <button type="button" class="border border-l-0 rounded-r px-3 py-2"
              @click="showPass = !showPass">
              {{ showPass ? 'Скрыть' : 'Показать' }}
            </button>
          </div>
          <p v-if="password && !passValid" class="text-xs text-red-600 mt-1">
            Пароль должен быть не короче 6 символов
          </p>
        </div>

        <!-- Ошибка формы -->
        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>

        <!-- Submit -->
        <button
          type="submit"
          class="w-full bg-gray-900 text-white rounded px-4 py-2 disabled:opacity-60"
          :disabled="!canSubmit"
        >
          {{ submitting ? 'Входим…' : 'Войти' }}
        </button>
      </form>
    </div>
  </div>
</template>
