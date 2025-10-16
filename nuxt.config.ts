// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  srcDir: 'app',
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [
      tailwindcss(),
    ],
      },

  modules: ['@pinia/nuxt'],

  pinia: { autoImports: ['defineStore', 'storeToRefs'] },
 runtimeConfig: {
    public: {
      apiBase: '/api', // ← фронт будет ходить на этот относительный путь
    },
  },
  nitro: {
    routeRules: {
      // Проксируем ВСЁ под /api/** на твой бэкенд
      // замени target на фактический бекенд, где лежат login/me/doctors
      '/api/**': { proxy: 'https://dd-tz-frontend.vercel.app/api/**' },
      // если бекенд другой, поставь его хост сюда
      // '/api/**': { proxy: 'https://your-backend.example.com/api/**' },
    },
  },


})