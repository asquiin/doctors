<script setup>
const auth = useAuthStore()
const { user } = storeToRefs(auth)

const router = useRouter()
const { public: { apiBase } } = useRuntimeConfig()

async function logout() {
  try {
    // если есть логаут на бэке — дерни его, иначе просто очисти локально
    await $fetch(`${apiBase}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(()=>{})
  } finally {
    auth.clearUser()
    router.push('/')
  }
}
</script>

<template>
  <header class="p-4 bg-gray-800 text-white flex justify-between">
    <NuxtLink to="/">Главная</NuxtLink>
     <nav class="flex gap-4 items-center">
      <NuxtLink to="/doctors">Врачи</NuxtLink>

      <!-- Если залогинен — аватарка -->
      <div v-if="user" class="flex items-center gap-3">
        <img :src="user.avatar || '/placeholder-avatar.png'" class="w-8 h-8 rounded-full object-cover" alt="">
        <span class="hidden sm:inline">{{ user.name || user.email }}</span>
        <button @click="logout" class="px-2 py-1 border rounded">Выйти</button>
      </div>

      <!-- Если нет — кнопка Войти -->
      <NuxtLink v-else :to="{ path: '/login', query: { redirect: 'back' } }" class="px-3 py-1 border rounded">
        Войти
      </NuxtLink>
    </nav>
  </header>

      <main class="flex-1"><slot /></main>
</template>
