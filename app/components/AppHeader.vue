<!-- components/AppHeader.vue -->
<template>
  <header class="p-4 bg-gray-800 text-white flex justify-between">
    <NuxtLink to="/">Главная</NuxtLink>
    <nav class="flex gap-3">
      <NuxtLink to="/services">Услуги</NuxtLink>
      <NuxtLink to="/contact">Контакты</NuxtLink>
    </nav>
  </header>
</template>
