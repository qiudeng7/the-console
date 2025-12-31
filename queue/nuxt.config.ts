// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },

  future: {
    compatibilityVersion: 4,
  },

  runtimeConfig: {
    // Private keys (only available server-side)
    databaseUrl: process.env.DATABASE_URL,
  },

  nitro: {
    experimental: {
      openAPI: true
    }
  }
})
