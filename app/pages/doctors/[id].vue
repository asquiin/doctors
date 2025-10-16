<!-- pages/doctors/[id].vue -->
<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const id = computed(() => route.params.id)

// базовый URL берём из runtimeConfig
const { public: { apiBase } } = useRuntimeConfig()

// ====== Состояние ======
const doctor = ref(null)
const loadingDoctor = ref(false)
const errorDoctor = ref(null)

const week = ref([])           // [{date, slots: [{id,startTime,endTime}], isWeekend?}]
const loadingSchedule = ref(false)
const errorSchedule = ref(null)

const selectedDate = ref(null) // ISO дня из week
const selectedSlots = computed(() => {
  const day = week.value.find(d => d.date === selectedDate.value)
  return day?.slots ?? []
})

// Отзывы
const reviews = ref([])
const reviewsLoading = ref(false)
const reviewsError = ref(null)
const reviewsPage = ref(1)
const reviewsLimit = ref(6)
const reviewsSortBy = ref('date')     // 'date' | 'rating'
const reviewsSortOrder = ref('desc')  // 'asc' | 'desc'
const reviewsTotal = ref(0)
const reviewsPages = computed(() => Math.max(1, Math.ceil(reviewsTotal.value / reviewsLimit.value)))

// форматтеры
const kzDate = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'Asia/Almaty' })
const kzTime = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Almaty' })
function fmtDate(iso) {
  try { return kzDate.format(new Date(iso)) } catch { return '' }
}
function fmtTime(iso) {
  try { return kzTime.format(new Date(iso)) } catch { return '' }
}

// ====== Загрузчики ======
async function fetchDoctor() {
  loadingDoctor.value = true
  errorDoctor.value = null
  try {
    const res = await $fetch(`${apiBase}/doctors/${id.value}`)
    doctor.value = res
  } catch (e) {
    errorDoctor.value = e?.data?.message || e?.message || 'Ошибка загрузки врача'
  } finally {
    loadingDoctor.value = false
  }
}

async function fetchSchedule() {
  loadingSchedule.value = true
  errorSchedule.value = null
  try {
    const res = await $fetch(`${apiBase}/doctors/${id.value}/schedule`)
    // ожидаем что придёт { days: [...] } или просто массив; приводим к единому виду
    const days = Array.isArray(res?.days) ? res.days : Array.isArray(res) ? res : []
    // показываем только дни с доступными слотами
    week.value = days
      .map(d => ({
        date: d.date,                               // ISO дня (например "2025-10-16")
        slots: (d.slots || []).filter(s => s?.startTime && s?.endTime),
        isWeekend: !!d.isWeekend
      }))
      .filter(d => d.slots.length > 0)

    // автоселект первого доступного дня
    if (week.value.length && !selectedDate.value) {
      selectedDate.value = week.value[0].date
    }
  } catch (e) {
    errorSchedule.value = e?.data?.message || e?.message || 'Ошибка загрузки расписания'
  } finally {
    loadingSchedule.value = false
  }
}

async function fetchReviews() {
  reviewsLoading.value = true
  reviewsError.value = null
  try {
    const res = await $fetch(`${apiBase}/doctors/${id.value}/reviews`, {
      query: {
        page: reviewsPage.value,
        limit: reviewsLimit.value,
        sortBy: reviewsSortBy.value,    // 'date' | 'rating'
        sortOrder: reviewsSortOrder.value
      }
    })
    // ожидаем формат { items, total } либо { reviews, pagination }
    const items = res?.items ?? res?.reviews ?? []
    const total = Number(res?.total ?? res?.pagination?.total ?? items.length)
    reviews.value = items
    reviewsTotal.value = total
  } catch (e) {
    reviewsError.value = e?.data?.message || e?.message || 'Ошибка загрузки отзывов'
  } finally {
    reviewsLoading.value = false
  }
}

// реакция на смену ID
watch(id, async () => {
  selectedDate.value = null
  reviewsPage.value = 1
  await Promise.all([fetchDoctor(), fetchSchedule(), fetchReviews()])
})

// первичная загрузка
onMounted(async () => {
  await Promise.all([fetchDoctor(), fetchSchedule(), fetchReviews()])
})

// при смене настроек отзывов — перезагружаем
watch([reviewsPage, reviewsLimit, reviewsSortBy, reviewsSortOrder], () => {
  fetchReviews()
})
</script>

<template>
  <div class="p-6 space-y-8">
    <!-- Инфо о враче -->
    <section>
      <div v-if="loadingDoctor" class="animate-pulse grid md:grid-cols-[200px_1fr] gap-6">
        <div class="w-48 h-48 bg-gray-200 rounded-xl" />
        <div class="space-y-3">
          <div class="h-6 bg-gray-200 rounded w-1/2" />
          <div class="h-4 bg-gray-200 rounded w-2/3" />
          <div class="h-4 bg-gray-200 rounded w-1/3" />
          <div class="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>

      <p v-else-if="errorDoctor" class="text-red-600">Ошибка: {{ errorDoctor }}</p>

      <div v-else-if="doctor" class="grid md:grid-cols-[200px_1fr] gap-6">
        <img
          :src="doctor.avatar || '/placeholder-avatar.png'"
          alt="Фото врача"
          class="w-48 h-48 object-cover rounded-xl"
        />

        <div class="space-y-3">
          <h1 class="text-2xl font-semibold">{{ doctor.name }}</h1>

          <div class="flex flex-wrap items-center gap-4 text-sm text-gray-700">
            <span class="px-2 py-1 border rounded">
              {{ doctor.specialtyName || doctor.specialty || 'Специальность не указана' }}
            </span>
            <span>★ {{ doctor.rating ?? '—' }} <span class="text-gray-500">({{ doctor.reviewCount ?? 0 }} отзывов)</span></span>
            <span v-if="doctor.experience != null">Стаж: <strong>{{ doctor.experience }}</strong> лет</span>
            <span v-if="doctor.price != null">Цена: <strong>{{ new Intl.NumberFormat('ru-RU').format(doctor.price) }}</strong> ₸</span>
          </div>

          <div v-if="doctor.education" class="text-sm">
            <span class="font-medium">Образование:</span> {{ doctor.education }}
          </div>

          <div v-if="doctor.description" class="text-sm">
            <span class="font-medium">Описание:</span> {{ doctor.description }}
          </div>

          <div v-if="doctor.achievements?.length" class="text-sm">
            <span class="font-medium">Достижения:</span>
            <ul class="list-disc list-inside text-gray-700">
              <li v-for="(a, i) in doctor.achievements" :key="i">{{ a }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Расписание на неделю -->
    <section>
      <h2 class="text-xl font-semibold mb-3">Расписание на неделю</h2>

      <div v-if="loadingSchedule" class="flex gap-2">
        <div v-for="i in 5" :key="i" class="w-28 h-20 bg-gray-200 animate-pulse rounded" />
      </div>
      <p v-else-if="errorSchedule" class="text-red-600">Ошибка: {{ errorSchedule }}</p>

      <div v-else>
        <div v-if="!week.length" class="text-gray-500">
          Нет доступных слотов на ближайшую неделю.
        </div>

        <div v-else class="space-y-4">
          <!-- Дни с доступными слотами -->
          <div class="flex flex-wrap gap-3">
            <button
              v-for="d in week"
              :key="d.date"
              class="px-3 py-2 border rounded"
              :class="selectedDate === d.date ? 'bg-gray-900 text-white' : 'bg-white hover:bg-gray-50'"
              @click="selectedDate = d.date"
              :title="d.isWeekend ? 'Выходной (работа до обеда)' : 'Рабочий день'"
            >
              {{ fmtDate(d.date) }}
              <span v-if="d.isWeekend" class="ml-1 text-xs opacity-80">(до 14:00)</span>
            </button>
          </div>

          <!-- Слоты выбранного дня -->
          <div v-if="selectedDate" class="flex flex-wrap gap-2">
            <button
              v-for="s in selectedSlots"
              :key="s.id"
              class="text-sm border rounded px-3 py-1 hover:bg-gray-50"
              :title="`${fmtTime(s.startTime)}–${fmtTime(s.endTime)}`"
              @click="$router.push(`/booking?doctorId=${encodeURIComponent(id)}&slotId=${encodeURIComponent(s.id)}`)"
            >
              {{ fmtTime(s.startTime) }}–{{ fmtTime(s.endTime) }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Отзывы -->
    <section>
      <div class="flex flex-wrap items-end justify-between gap-3 mb-3">
        <h2 class="text-xl font-semibold">Отзывы</h2>

        <div class="flex items-center gap-2">
          <label class="text-sm">Сортировать по:</label>
          <select v-model="reviewsSortBy" class="border rounded px-3 py-2">
            <option value="date">Дате</option>
            <option value="rating">Рейтингу</option>
          </select>
          <select v-model="reviewsSortOrder" class="border rounded px-3 py-2">
            <option value="desc">Сначала новые/высокие</option>
            <option value="asc">Сначала старые/низкие</option>
          </select>
        </div>
      </div>

      <div v-if="reviewsLoading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="border rounded p-4 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          <div class="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
      <p v-else-if="reviewsError" class="text-red-600">Ошибка: {{ reviewsError }}</p>

      <div v-else>
        <p v-if="!reviews.length" class="text-gray-500">Отзывов пока нет.</p>

        <div v-else class="space-y-3">
          <article v-for="r in reviews" :key="r.id" class="border rounded p-4">
            <div class="flex items-center justify-between">
              <h3 class="font-medium">
                {{ r.patientName || 'Аноним' }}
                <span class="ml-2 text-yellow-600">★ {{ r.rating ?? '—' }}</span>
              </h3>
              <time class="text-sm text-gray-500">
                {{ new Date(r.date || r.createdAt || Date.now()).toLocaleDateString('ru-RU') }}
              </time>
            </div>
            <p class="mt-2 text-gray-800 whitespace-pre-line">
              {{ r.text || r.comment || '' }}
            </p>
          </article>

          <!-- Пагинация отзывов -->
          <div class="flex items-center justify-center gap-2 pt-2">
            <button class="px-3 py-2 border rounded disabled:opacity-50" :disabled="reviewsPage <= 1" @click="reviewsPage--">
              Назад
            </button>
            <span>Стр. {{ reviewsPage }} из {{ reviewsPages }}</span>
            <button class="px-3 py-2 border rounded disabled:opacity-50" :disabled="reviewsPage >= reviewsPages" @click="reviewsPage++">
              Вперёд
            </button>

            <select v-model.number="reviewsLimit" class="ml-4 border rounded px-2 py-1">
              <option :value="6">6</option>
              <option :value="12">12</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
