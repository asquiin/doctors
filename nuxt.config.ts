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
      apiBase: 'https://dd-tz-frontend.vercel.app/api', 
    },
  },
})