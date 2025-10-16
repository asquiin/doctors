<script setup lang="ts">
import { type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRequestsStore } from '~/stores/requests' 

const store = useRequestsStore()
const { user } = storeToRefs(store) as {
  user: Ref<{ name?: string; email?: string; avatar?: string } | null>
  token: Ref<string | null>
}

async function logout(): Promise<void> {
alert('you logged out');
  window.location.reload();
}
</script>

<template>
  <header class="p-4 bg-gray-800 text-white">
 

    <nav class="flex gap-4 items-center justify-between">
         <NuxtLink to="/">Главная</NuxtLink>

      <div v-if="user" class="flex items-center gap-3">
        <img :src="user.avatar || '/placeholder-avatar.png'" class="w-8 h-8 rounded-full object-cover" alt="">
        <span class="hidden sm:inline">{{ user.name || user.email }}</span>
        <button @click="logout" class="px-2 py-1 border rounded">Выйти</button>
      </div>


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
