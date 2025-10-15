<!-- layouts/default.vue -->
<template>
  <div>
    <header class="p-4 bg-gray-900 text-white flex justify-between">
      <NuxtLink to="/">🏠 Главная</NuxtLink>

      <nav class="flex gap-4">
        <NuxtLink to="/about">О нас</NuxtLink>
        <NuxtLink to="/contact">Контакты</NuxtLink>
      </nav>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>

<style scoped>
header a.router-link-active {
  font-weight: bold;
  text-decoration: underline;
}
</style>
