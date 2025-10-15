<script setup>
const requests = useRequestsStore()
const { data, loading, error } = storeToRefs(requests)

onMounted(() => {
  requests.getData({
    page: 1,
    sortBy: 'rating',
    sortOrder: 'desc',
  })
})
</script>

<template>
  <div class="p-6">
    <p v-if="loading">Загрузка…</p>
    <p v-else-if="error" class="text-red-500">Ошибка: {{ error }}</p>
    <pre v-else>{{ data }}</pre>
  </div>
</template>
