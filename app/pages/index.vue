<!-- pages/doctors.vue -->
<script setup lang="ts">
import type { DoctorsResponse } from '~/stores/requests'

const requests = useRequestsStore()
const { data, loading, error } = storeToRefs(requests)

const page = ref<number>(1)
const limit = ref<number>(6)

type Specialty = { id: string; name: string }
const specialties = ref<Specialty[]>([{ id: '', name: 'Все специальности' }])
const specialtyMap = computed<Record<string, string>>(
  () => Object.fromEntries(specialties.value.filter(s => s.id).map(s => [s.id, s.name]))
)
const selectedSpecialty = ref<string>('')

const minRating = ref<number>(0)
const searchName = ref<string>('')

const sortBy = ref<'rating' | 'experience' | 'price' | 'name'>('rating')
const sortOrder = ref<'asc' | 'desc'>('desc')

const { public: { apiBase } } = useRuntimeConfig()

// эндпоинты берём ИЗ СТРАНИЦЫ:
const DOCTORS_ENDPOINT = ref<string>('/doctors')       // можно заменить на другой, напр. '/v2/doctors'
const SPECIALTIES_ENDPOINT = ref<string>('/specialties')

onMounted(async () => {
  try {
    const res = await $fetch<Specialty[]>(`${apiBase}${SPECIALTIES_ENDPOINT.value}`)
    if (Array.isArray(res)) {
      specialties.value = [{ id: '', name: 'Все специальности' }, ...res]
    }
  } catch (e) {
    console.warn('Не удалось загрузить /specialties', e)
  }
})

let t: ReturnType<typeof setTimeout> | null = null
function scheduleFetch() {
  if (t) clearTimeout(t)
  t = setTimeout(async () => {
    await requests.getData<DoctorsResponse>(DOCTORS_ENDPOINT.value, {
      page: page.value,
      limit: limit.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      specialty: selectedSpecialty.value || undefined,
      minRating: minRating.value || undefined,
      q: searchName.value || undefined,
    })
  }, 250)
}

onMounted(scheduleFetch)
watch([page, limit, sortBy, sortOrder, selectedSpecialty, minRating, searchName], scheduleFetch)

const items = computed(() => (data.value as DoctorsResponse | null)?.doctors ?? [])
const pg = computed(() =>
  (data.value as DoctorsResponse | null)?.pagination ?? {
    page: 1, limit: limit.value, total: 0, pages: 1, hasNext: false, hasPrev: false
  }
)
const totalPages = computed(() => Number(pg.value.pages || 1))

function resetFilters() {
  selectedSpecialty.value = ''
  minRating.value = 0
  searchName.value = ''
  sortBy.value = 'rating'
  sortOrder.value = 'desc'
  page.value = 1
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

watch([sortBy, sortOrder, selectedSpecialty, minRating, searchName], () => { page.value = 1 })

const kzFmt = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Almaty' })
function fmtSlot(iso?: string) {
  try { return iso ? kzFmt.format(new Date(iso)) : '' } catch { return '' }
}

// корректный переход по слоту — через navigateTo (без $router)
const goToDoctorSlot = (docId: string, slot: { id: string; startTime: string }) => {
  navigateTo({ name: 'doctors-id', params: { id: docId }, query: { slotId: slot.id, start: slot.startTime } })
}
</script>

<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-semibold">Врачи</h1>

    <!-- Фильтры/Сортировка -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
      <div class="lg:col-span-3">
        <label class="block text-sm font-medium mb-1">Специальность</label>
        <select v-model="selectedSpecialty" class="w-full border rounded px-3 py-2">
          <option v-for="s in specialties" :key="s.id || 'all'" :value="s.id">{{ s.name }}</option>
        </select>
      </div>

      <div class="lg:col-span-3">
        <label class="block text-sm font-medium mb-1">Минимальный рейтинг: <strong>{{ minRating }}</strong></label>
        <input type="range" min="0" max="5" step="0.5" v-model.number="minRating" class="w-full" />
      </div>

      <div class="lg:col-span-3">
        <label class="block text-sm font-medium mb-1">Поиск по ФИО</label>
        <div class="flex gap-2">
          <input v-model.trim="searchName" type="text" placeholder="Например: Волков" class="flex-1 border rounded px-3 py-2" />
          <button v-if="searchName" @click="searchName = ''" class="border rounded px-3 py-2" title="Очистить">✕</button>
        </div>
      </div>

      <div class="lg:col-span-3">
        <label class="block text-sm font-medium mb-1">Сортировка</label>
        <div class="flex gap-2">
          <select v-model="sortBy" class="flex-1 border rounded px-3 py-2">
            <option value="rating">По рейтингу</option>
            <option value="experience">По стажу</option>
            <option value="price">По цене</option>
            <option value="name">По имени (A–Z)</option>
          </select>
          <button @click="toggleSortOrder" class="border rounded px-3 py-2 min-w-24" :title="sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'">
            {{ sortOrder === 'asc' ? '↑' : '↓' }}
          </button>
        </div>
      </div>

      <div class="lg:col-span-12 flex flex-wrap gap-3 justify-between items-center">
        <div class="flex items-center gap-2">
          <label class="text-sm">На странице:</label>
          <select v-model.number="limit" class="border rounded px-2 py-1">
            <option :value="6">6</option>
            <option :value="12">12</option>
            <option :value="24">24</option>
          </select>
        </div>
        <button @click="resetFilters" class="px-3 py-2 border rounded">Сбросить фильтры</button>
      </div>
    </div>

    <!-- Контент -->
    <div v-if="loading" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="animate-pulse border rounded p-4 space-y-3">
        <div class="h-44 bg-gray-200 rounded" />
        <div class="h-5 bg-gray-200 rounded w-2/3" />
        <div class="h-4 bg-gray-200 rounded w-1/2" />
        <div class="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    </div>

    <p v-else-if="error" class="text-red-600">Ошибка: {{ error }}</p>

    <div v-else>
      <div v-if="!items.length" class="text-gray-500">Ничего не найдено. Измените фильтры.</div>

      <div v-else class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <article v-for="doc in items" :key="doc.id" class="border rounded-lg overflow-hidden flex flex-col">
          <div class="flex justify-center items-center">
            <img :src="doc.avatar || '/placeholder-avatar.png'" alt="Фото врача" class="w-50 h-44 object-cover" />
          </div>

          <div class="p-4 space-y-2 flex-1">
            <h3 class="text-lg font-semibold">{{ doc.name }}</h3>

            <p class="text-sm text-gray-600">
              {{ specialtyMap[doc.specialty] || 'Специальность не указана' }}
            </p>

            <div class="flex items-center gap-2 text-sm">
              <span class="font-medium">★ {{ (doc.rating ?? '—') }}</span>
              <span class="text-gray-500">({{ doc.reviewCount ?? 0 }} отзывов)</span>
            </div>

            <p v-if="doc.experience != null" class="text-sm">
              Стаж: <strong>{{ doc.experience }}</strong> лет
            </p>

            <p v-if="doc.price != null" class="text-sm">
              Цена: <strong>{{ new Intl.NumberFormat('ru-RU').format(doc.price) }}</strong> ₸
            </p>

            <div v-if="doc.achievements?.length" class="text-sm">
              <span class="font-medium">Достижения:</span>
              <ul class="list-disc list-inside text-gray-700">
                <li v-for="(a, i) in doc.achievements.slice(0, 3)" :key="i">{{ a }}</li>
                <li v-if="doc.achievements.length > 3" class="text-gray-500">+ ещё {{ doc.achievements.length - 3 }}</li>
              </ul>
            </div>

            <div v-if="doc.todaySlots?.length" class="pt-2">
              <p class="text-sm font-medium mb-1">Свободные слоты сегодня:</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="slot in doc.todaySlots.slice(0, 4)"
                  :key="slot.id"
                  class="text-sm border rounded px-2 py-1 hover:bg-gray-50"
                  @click="goToDoctorSlot(doc.id, slot)"
                  :title="`Записаться на ${fmtSlot(slot.startTime)}–${fmtSlot(slot.endTime)}`"
                >
                  {{ fmtSlot(slot.startTime) }}–{{ fmtSlot(slot.endTime) }}
                </button>
                <span v-if="doc.todaySlots.length > 4" class="text-gray-500 text-sm">
                  + ещё {{ doc.todaySlots.length - 4 }}
                </span>
              </div>
            </div>
          </div>

          <div class="p-4 pt-0">
            <NuxtLink :to="{ name: 'doctors-id', params: { id: doc.id } }" class="inline-block w-full text-center bg-gray-900 text-white px-4 py-2 rounded hover:opacity-90">
              Подробнее
            </NuxtLink>
          </div>
        </article>
      </div>

      <div class="mt-6 flex items-center justify-center gap-2">
        <button class="px-3 py-2 border rounded disabled:opacity-50" :disabled="!pg.hasPrev" @click="page--">Назад</button>
        <span class="px-3 py-2">Стр. {{ page }} из {{ totalPages }}</span>
        <button class="px-3 py-2 border rounded disabled:opacity-50" :disabled="!pg.hasNext" @click="page++">Вперёд</button>
      </div>
    </div>
  </div>
</template>
