<script setup lang="ts">
import { onMounted, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRequestsStore } from '~/stores/requests' // твой requests.ts

// Стор
const store = useRequestsStore()
// Явно подсказываем типы ссылок
const { user, token } = storeToRefs(store) as {
  user: Ref<{ name?: string; email?: string; avatar?: string } | null>
  token: Ref<string | null>
}

const router = useRouter()
const { public: { apiBase } } = useRuntimeConfig()

onMounted(async () => {
  if (token.value && !user.value) {
    try {
      await store.getMe()
      console.log('[AppHeader] user loaded:', user.value)
    } catch (e) {
      console.warn('[AppHeader] getMe failed:', e)
    }
  }
})

async function logout(): Promise<void> {
  try {
    await $fetch(`${apiBase}/auth/logout`, {
      method: 'POST',
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : undefined,
    }).catch(() => {})
  } finally {
    store.clearAuth()
    await router.push('/')
  }
}
</script>

<template>
  <header class="p-4 bg-gray-800 text-white">
 

    <nav class="flex gap-4 items-center justify-between">
         <NuxtLink to="/">Главная</NuxtLink>
      <!-- Если залогинен — аватарка -->
      <div v-if="user" class="flex items-center gap-3">
        <img :src="user.avatar || '/placeholder-avatar.png'" class="w-8 h-8 rounded-full object-cover" alt="">
        <span class="hidden sm:inline">{{ user.name || user.email }}</span>
        <button @click="logout" class="px-2 py-1 border rounded">Выйти</button>
      </div>

      <!-- Если нет — кнопка Войти -->
      <NuxtLink
        v-else
        :to="{ path: '/login', query: { redirect: 'back' } }"
        class="px-3 py-1 border rounded"
      >
        Войти
      </NuxtLink>
    </nav>
  </header>

  <main class="flex-1"><slot /></main>
</template>
