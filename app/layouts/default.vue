<template>
  <header class="p-4 bg-gray-800 text-white flex justify-between">
    <NuxtLink to="/">Главная</NuxtLink>
    <nav class="flex gap-3">
      <NuxtLink to="/login">Логин</NuxtLink>
    </nav>
  </header>

      <main class="flex-1"><slot /></main>
</template>
