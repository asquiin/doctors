<!-- pages/doctors/[id].vue -->
<script setup lang="ts">
import { useRoute } from 'vue-router'

/** ===== Типы API ===== */
type ISO = string

export interface DoctorSlot {
  id: string
  startTime: ISO
  endTime: ISO
}

export interface DoctorFull {
  id: string
  name: string
  specialty: string
  specialtyName?: string
  rating?: number
  reviewCount?: number
  experience?: number
  price?: number
  avatar?: string
  education?: string
  description?: string
  achievements?: string[]
}

export interface Review {
  id: string
  patientName?: string
  rating?: number
  text?: string
  comment?: string
  date?: ISO
  createdAt?: ISO
}

export interface ReviewsResponseFlat {
  items: Review[]
  total: number
}
export interface ReviewsResponsePaged {
  reviews: Review[]
  pagination: { total: number }
}

/** Расписание от твоего API — плоский массив слотов */
export type ScheduleResponse = DoctorSlot[]

/** Структура, с которой удобно работать в UI */
export interface WeekDay {
  date: string;                 // 'YYYY-MM-DD'
  slots: DoctorSlot[];
  isWeekend: boolean;
}

/** ===== Параметры роутинга/конфиг ===== */
const route = useRoute()
const id = computed<string>(() => route.params.id as string)

const { public: { apiBase } } = useRuntimeConfig()

/** ===== Состояние врача ===== */
const doctor = ref<DoctorFull | null>(null)
const loadingDoctor = ref<boolean>(false)
const errorDoctor = ref<string | null>(null)

/** ===== Состояние расписания ===== */
const week = ref<WeekDay[]>([])
const loadingSchedule = ref<boolean>(false)
const errorSchedule = ref<string | null>(null)

const selectedDate = ref<string | null>(null)
const selectedSlots = computed<DoctorSlot[]>(() => {
  const day = week.value.find(d => d.date === selectedDate.value)
  return day?.slots ?? []
})

/** ===== Состояние отзывов ===== */
const reviews = ref<Review[]>([])
const reviewsLoading = ref<boolean>(false)
const reviewsError = ref<string | null>(null)
const reviewsPage = ref<number>(1)
const reviewsLimit = ref<number>(6)
const reviewsSortBy = ref<'date' | 'rating'>('date')
const reviewsSortOrder = ref<'asc' | 'desc'>('desc')
const reviewsTotal = ref<number>(0)
const reviewsPages = computed<number>(() => Math.max(1, Math.ceil(reviewsTotal.value / reviewsLimit.value)))

/** ===== Форматтеры ===== */
function dayKeyFromISO(iso: ISO): string {
  return new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Asia/Almaty' }) // YYYY-MM-DD
}
const kzDate = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'Asia/Almaty'
})
const kzTime = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Almaty'
})
function fmtDateKey(dateKey: string): string {
  try { return kzDate.format(new Date(`${dateKey}T00:00:00`)) } catch { return dateKey }
}
function fmtTime(iso: ISO): string {
  try { return kzTime.format(new Date(iso)) } catch { return '' }
}
function isWeekendByKey(dateKey: string): boolean {
  const d = new Date(`${dateKey}T00:00:00`)
  const day = d.getDay() // 0=Вс,6=Сб
  return day === 0 || day === 6
}

function openBooking(slot: DoctorSlot) {
  navigateTo({
    path: '/booking',
    query: { doctorId: id.value, slotId: slot.id, start: slot.startTime }
  })
}


/** ===== Загрузчики ===== */
async function fetchDoctor(): Promise<void> {
  loadingDoctor.value = true
  errorDoctor.value = null
  try {
    const res = await $fetch<DoctorFull>(`${apiBase}/doctors/${id.value}`)
    doctor.value = res
  } catch (e: any) {
    errorDoctor.value = e?.data?.message || e?.message || 'Ошибка загрузки врача'
  } finally {
    loadingDoctor.value = false
  }
}

async function fetchSchedule(): Promise<void> {
  loadingSchedule.value = true
  errorSchedule.value = null
  try {
    const res = await $fetch<ScheduleResponse>(`${apiBase}/doctors/${id.value}/schedule`)
    const slots = Array.isArray(res) ? res : []

    const map = new Map<string, DoctorSlot[]>()
    for (const s of slots) {
      if (!s?.startTime || !s?.endTime) continue
      const key = dayKeyFromISO(s.startTime)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    }

    week.value = Array.from(map.entries())
      .map(([date, list]): WeekDay => ({
        date,
        slots: list,
        isWeekend: isWeekendByKey(date),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    selectedDate.value = week.value.length ? week.value[0].date : null
  } catch (e: any) {
    errorSchedule.value = e?.data?.message || e?.message || 'Ошибка загрузки расписания'
  } finally {
    loadingSchedule.value = false
  }
}

async function fetchReviews(): Promise<void> {
  reviewsLoading.value = true
  reviewsError.value = null
  try {
    const res = await $fetch<ReviewsResponseFlat | ReviewsResponsePaged | { items?: Review[]; total?: number }>(
      `${apiBase}/doctors/${id.value}/reviews`,
      {
        query: {
          page: reviewsPage.value,
          limit: reviewsLimit.value,
          sortBy: reviewsSortBy.value,
          sortOrder: reviewsSortOrder.value
        }
      }
    )

    const items: Review[] =
      (res as ReviewsResponseFlat)?.items ??
      (res as ReviewsResponsePaged)?.reviews ??
      []

    const total: number = Number(
      (res as ReviewsResponseFlat)?.total ??
      (res as ReviewsResponsePaged)?.pagination?.total ??
      items.length
    )

    reviews.value = items
    reviewsTotal.value = total
  } catch (e: any) {
    reviewsError.value = e?.data?.message || e?.message || 'Ошибка загрузки отзывов'
  } finally {
    reviewsLoading.value = false
  }
}

/** ===== Реакция на смену ID ===== */
watch(id, async () => {
  selectedDate.value = null
  reviewsPage.value = 1
  await Promise.all([fetchDoctor(), fetchSchedule(), fetchReviews()])
})

/** ===== Первичная загрузка ===== */
onMounted(async () => {
  await Promise.all([fetchDoctor(), fetchSchedule(), fetchReviews()])
})

/** ===== Перезагрузка отзывов при смене настроек ===== */
watch([reviewsPage, reviewsLimit, reviewsSortBy, reviewsSortOrder], () => {
  void fetchReviews()
})

/** ===== Навигация ===== */
function goBooking(doctorId: string, slot: DoctorSlot) {
  navigateTo({
    path: '/booking',
    query: { doctorId, slotId: slot.id, start: slot.startTime }
  })
}
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
        <img :src="doctor.avatar || '/placeholder-avatar.png'" alt="Фото врача" class="w-48 h-48 object-cover rounded-xl" />

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
                @click="openBooking(s)"
              :class="selectedDate === d.date ? 'bg-gray-900 text-white' : 'bg-white hover:bg-gray-50'"
            
              :title="d.isWeekend ? 'Выходной (работа до обеда)' : 'Рабочий день'"
            >
              {{ fmtDateKey(d.date) }}
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
              @click="goBooking(id, s)"
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
