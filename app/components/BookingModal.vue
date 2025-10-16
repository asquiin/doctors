<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRequestsStore } from '~/stores/requests.ts'

type ISO = string

const props = defineProps<{
  doctorId: string
  slotId: string
  start: ISO
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const route = useRoute()
const router = useRouter()
const store = useRequestsStore()

// если не авторизован — на /login с возвратом на эту же страницу (с текущими query)
onMounted(async () => {
  if (!store.token) {
    return router.replace({
      path: '/login',
      query: { redirect: route.fullPath }
    })
  }
  if (!store.user) {
    try { await store.getData('/auth/me') } catch {}
  }
})

const kzDateTime = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  timeZone: 'Asia/Almaty'
})
const slotPreview = computed(() => {
  try { return props.start ? kzDateTime.format(new Date(props.start)) : '' } catch { return '' }
})

// --- поля формы ---
const complaints = ref<string>('')
const diseases   = ref<string>('')
const heightCm   = ref<number | null>(null)
const weightKg   = ref<number | null>(null)
const file       = ref<File | null>(null)

const submitting = ref(false)
const formError  = ref<string | null>(null)
const formOk     = ref<string | null>(null)

const ACCEPT = [
  'application/pdf',
  'image/jpeg', 'image/jpg', 'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]
const MAX_FILE_MB = 10

function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] || null
  if (!f) { file.value = null; return }
  if (!ACCEPT.includes(f.type)) { formError.value = 'Недопустимый тип файла'; file.value = null; return }
  if (f.size > MAX_FILE_MB * 1024 * 1024) { formError.value = `Файл больше ${MAX_FILE_MB} МБ`; file.value = null; return }
  formError.value = null
  file.value = f
}

// валидация
const complaintsValid = computed(() => complaints.value.trim().length > 0)
const heightValid = computed(() => typeof heightCm.value === 'number' && heightCm.value >= 50 && heightCm.value <= 250)
const weightValid = computed(() => typeof weightKg.value === 'number' && weightKg.value >= 20 && weightKg.value <= 300)
const canSubmit = computed(() => !!store.token && complaintsValid.value && heightValid.value && weightValid.value && !submitting.value)

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  formError.value = null
  formOk.value = null

  try {
    const fd = new FormData()
    // ключи под твой бек:
    fd.append('scheduleSlotId', props.slotId)
    fd.append('complaints', complaints.value.trim())
    if (diseases.value.trim()) fd.append('chronicDiseases', diseases.value.trim())
    fd.append('height', String(heightCm.value))
    fd.append('weight', String(weightKg.value))
    if (file.value) fd.append('testResults', file.value)

    // <<< вот здесь используем стор >>>
    await store.postData('/appointments', fd, 'POST')

    formOk.value = 'Запись успешно создана'
    setTimeout(() => {
      emit('success')
      emit('close')
    }, 500)
  } catch (e: any) {
    formError.value = e?.message || 'Не удалось создать запись'
  } finally {
    submitting.value = false
  }
}

function close() { emit('close') }
</script>


<template>
  <!-- Teleport модалки на body -->
  <Teleport to="body">
    <div class="fixed inset-0 z-50">
      <!-- backdrop -->
      <div class="absolute inset-0 bg-black/40" @click="close" />
      <!-- modal -->
      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="w-full max-w-xl bg-white rounded-2xl shadow-xl p-6 space-y-5">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-xl font-semibold">Запись на приём</h2>
              <p v-if="slotPreview" class="text-sm text-gray-600 mt-1">
                Дата и время: <strong>{{ slotPreview }}</strong>
              </p>
            </div>
            <button class="text-gray-500 hover:text-gray-800" @click="close" title="Закрыть">✕</button>
          </div>

          <form @submit.prevent="submit" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Жалобы <span class="text-red-500">*</span></label>
              <textarea v-model.trim="complaints" rows="3" class="w-full border rounded px-3 py-2" placeholder="Кратко опишите ваши жалобы" />
              <p v-if="complaints && !complaintsValid" class="text-xs text-red-600 mt-1">Опишите жалобы</p>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Хронические заболевания</label>
              <textarea v-model.trim="diseases" rows="2" class="w-full border rounded px-3 py-2" placeholder="Перечислите, если есть" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Рост (см) <span class="text-red-500">*</span></label>
                <input v-model.number="heightCm" type="number" min="50" max="250" class="w-full border rounded px-3 py-2" placeholder="Например: 175" />
                <p v-if="heightCm !== null && !heightValid" class="text-xs text-red-600 mt-1">Укажите рост от 50 до 250 см</p>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Вес (кг) <span class="text-red-500">*</span></label>
                <input v-model.number="weightKg" type="number" min="20" max="300" class="w-full border rounded px-3 py-2" placeholder="Например: 70" />
                <p v-if="weightKg !== null && !weightValid" class="text-xs text-red-600 mt-1">Укажите вес от 20 до 300 кг</p>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Результаты анализов (необязательно)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                @change="onFileChange"
                class="w-full"
              />
              <p class="text-xs text-gray-500 mt-1">Допустимые форматы: PDF, JPG, JPEG, PNG, DOC, DOCX, TXT. До 10 МБ.</p>
            </div>

            <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
            <p v-if="formOk" class="text-sm text-green-600">{{ formOk }}</p>

            <div class="flex gap-3 justify-end pt-2">
              <button type="button" class="px-4 py-2 border rounded" @click="close">Отмена</button>
              <button type="submit" class="px-4 py-2 bg-gray-900 text-white rounded disabled:opacity-60" :disabled="!canSubmit">
                {{ submitting ? 'Отправляем…' : 'Записаться' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
