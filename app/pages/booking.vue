<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRequestsStore } from '~/stores/requests'

type ISO = string

// Query: ?doctorId=...&slotId=...&start=...
const route = useRoute()
const router = useRouter()

const doctorId = computed(() => (route.query.doctorId as string) || '')
const slotId   = computed(() => (route.query.slotId as string) || '')
const startISO = computed<ISO>(() => (route.query.start as string) || '')

const store = useRequestsStore()
const { public: { apiBase } } = useRuntimeConfig()

// --- Гейт авторизации ---
onMounted(async () => {
  // если токена нет — на логин (вернёмся обратно после входа)
  if (!store.token) {
    return router.replace({ path: '/login', query: { redirect: 'back' } })
  }
  // если токен есть, но user не подтянут — попробуем /auth/me (не критично)
  if (!store.user) {
    try { await store.getMe() } catch {}
  }
})

// --- Формат даты/время для превью слота ---
const kzDate = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  timeZone: 'Asia/Almaty'
})
const slotPreview = computed(() => {
  try { return startISO.value ? kzDate.format(new Date(startISO.value)) : '' } catch { return '' }
})

// --- Поля формы ---
const complaints = ref<string>('')
const diseases   = ref<string>('')         // необязательное
const heightCm   = ref<number | null>(null) // 50–250
const weightKg   = ref<number | null>(null) // 20–300
const file       = ref<File | null>(null)

const submitting = ref(false)
const formError  = ref<string | null>(null)
const formOk     = ref<string | null>(null)

// Допустимые типы/расширения
const ACCEPT = [
  'application/pdf',
  'image/jpeg', 'image/jpg', 'image/png',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain'
]
const MAX_FILE_MB = 10

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const f = target.files?.[0] || null
  if (!f) { file.value = null; return }

  // Проверка типа и размера
  if (!ACCEPT.includes(f.type)) {
    formError.value = 'Недопустимый тип файла'
    file.value = null
    return
  }
  if (f.size > MAX_FILE_MB * 1024 * 1024) {
    formError.value = `Файл больше ${MAX_FILE_MB} МБ`
    file.value = null
    return
  }
  formError.value = null
  file.value = f
}

// Валидация
const complaintsValid = computed(() => complaints.value.trim().length > 0)
const heightValid     = computed(() => typeof heightCm.value === 'number' && heightCm.value >= 50 && heightCm.value <= 250)
const weightValid     = computed(() => typeof weightKg.value === 'number' && weightKg.value >= 20 && weightKg.value <= 300)
const canSubmit       = computed(() =>
  !!store.token && complaintsValid.value && heightValid.value && weightValid.value && !submitting.value
)

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  formError.value = null
  formOk.value = null

  try {
    // Собираем FormData
    const fd = new FormData()
    fd.append('doctorId', doctorId.value)
    fd.append('slotId', slotId.value)
    fd.append('complaints', complaints.value.trim())
    if (diseases.value.trim()) fd.append('diseases', diseases.value.trim())
    fd.append('heightCm', String(heightCm.value))
    fd.append('weightKg', String(weightKg.value))
    if (file.value) fd.append('attachment', file.value)

    // POST /api/appointments (требует авторизации)
    await $fetch(`${apiBase}/appointments`, {
      method: 'POST',
      body: fd,
      headers: store.token ? { Authorization: `Bearer ${store.token}` } : undefined,
    })

    formOk.value = 'Запись успешно создана'
    // короткая пауза, затем закрываем "модалку" (возврат)
    setTimeout(() => {
      // если знаем врача — вернёмся на его страницу
      if (doctorId.value) router.replace({ name: 'doctors-id', params: { id: doctorId.value } })
      else router.back()
    }, 500)
  } catch (e: any) {
    formError.value = e?.data?.message || e?.message || 'Не удалось создать запись'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <!-- Страница-модалка (route-modal). Можно использовать layout="empty", если нужно на затемнённом фоне -->
  <div class="min-h-screen bg-black/30 flex items-center justify-center p-4">
    <div class="w-full max-w-xl bg-white rounded-2xl shadow-xl p-6 space-y-5">
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-xl font-semibold">Запись на приём</h1>
          <p v-if="slotPreview" class="text-sm text-gray-600 mt-1">
            Дата и время: <strong>{{ slotPreview }}</strong>
          </p>
        </div>
        <button class="text-gray-500 hover:text-gray-800" @click="$router.back()" title="Закрыть">✕</button>
      </div>

      <!-- Требуется авторизация -->
      <div v-if="!$pinia.state.value.requests?.token" class="text-sm text-red-600">
        Необходимо войти в систему. Перенаправляем…
      </div>

      <!-- Форма -->
      <form v-else @submit.prevent="submit" class="space-y-4">
        <!-- Жалобы (обязательное) -->
        <div>
          <label class="block text-sm font-medium mb-1">Жалобы<span class="text-red-500">*</span></label>
          <textarea
            v-model.trim="complaints"
            rows="3"
            class="w-full border rounded px-3 py-2"
            placeholder="Кратко опишите ваши жалобы"
          />
          <p v-if="complaints && !complaintsValid" class="text-xs text-red-600 mt-1">
            Опишите жалобы
          </p>
        </div>

        <!-- Хронические заболевания (необязательно) -->
        <div>
          <label class="block text-sm font-medium mb-1">Хронические заболевания</label>
          <textarea
            v-model.trim="diseases"
            rows="2"
            class="w-full border rounded px-3 py-2"
            placeholder="Перечислите, если есть"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Рост -->
          <div>
            <label class="block text-sm font-medium mb-1">Рост (см)<span class="text-red-500">*</span></label>
            <input
              v-model.number="heightCm"
              type="number"
              min="50"
              max="250"
              class="w-full border rounded px-3 py-2"
              placeholder="Например: 175"
            />
            <p v-if="heightCm !== null && !heightValid" class="text-xs text-red-600 mt-1">
              Укажите рост от 50 до 250 см
            </p>
          </div>

          <!-- Вес -->
          <div>
            <label class="block text-sm font-medium mb-1">Вес (кг)<span class="text-red-500">*</span></label>
            <input
              v-model.number="weightKg"
              type="number"
              min="20"
              max="300"
              class="w-full border rounded px-3 py-2"
              placeholder="Например: 70"
            />
            <p v-if="weightKg !== null && !weightValid" class="text-xs text-red-600 mt-1">
              Укажите вес от 20 до 300 кг
            </p>
          </div>
        </div>

        <!-- Файл (необязательный) -->
        <div>
          <label class="block text-sm font-medium mb-1">Результаты анализов (необязательно)</label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            @change="onFileChange"
            class="w-full"
          />
          <p class="text-xs text-gray-500 mt-1">
            Допустимые форматы: PDF, JPG, JPEG, PNG, DOC, DOCX, TXT. До 10 МБ.
          </p>
        </div>

        <!-- Ошибки/статус -->
        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        <p v-if="formOk" class="text-sm text-green-600">{{ formOk }}</p>

        <!-- Действия -->
        <div class="flex gap-3 justify-end pt-2">
          <button type="button" class="px-4 py-2 border rounded" @click="$router.back()">Отмена</button>
          <button
            type="submit"
            class="px-4 py-2 bg-gray-900 text-white rounded disabled:opacity-60"
            :disabled="!canSubmit"
          >
            {{ submitting ? 'Отправляем…' : 'Записаться' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
