<!-- layouts/default.vue -->
<script setup>
import AppHeader from '~/components/AppHeader.vue'
</script>

<template>
  <div>
    <AppHeader />
    <main><slot /></main>
  </div>
</template>
