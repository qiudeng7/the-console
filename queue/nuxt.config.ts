// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },

  future: {
    compatibilityVersion: 4,
  },

  ssr: true, // 启用 SSR，让 API 路由能正常工作

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
