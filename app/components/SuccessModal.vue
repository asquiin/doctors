<script setup lang="ts">
const props = defineProps<{ message: string }>()
const visible = ref(true)
setTimeout(() => visible.value = false, 2500)
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="visible"
        class="fixed top-6 right-6 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-[9999]"
      >
        {{ message }}
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
