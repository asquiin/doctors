<script setup lang="ts">
definePageMeta({ layout: 'default' })

const router = useRouter()
const email = ref('')
const password = ref('')
const showPass = ref(false)
const formError = ref<string | null>(null)
const submitting = ref(false)

const emailValid = computed(() => /\S+@\S+\.\S+/.test(email.value))
const passValid  = computed(() => password.value.length >= 6)
const canSubmit  = computed(() => emailValid.value && passValid.value && !submitting.value)

const req = useRequestsStore()

async function onSubmit() {
  if (!canSubmit.value) return
  submitting.value = true
  formError.value = null
  try {
    const res = await req.postLogin({ email: email.value, password: password.value })
    await router.replace('/')
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

        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>

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
