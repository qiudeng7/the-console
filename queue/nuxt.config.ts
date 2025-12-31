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
    },
    // 配置端口为 4000（队列服务专用端口）
    port: 4000,
    // 禁用 SSR，这是纯 API 服务
    ssr: false
  },

  // 禁用 Vue Router 和 SPA
  ssr: true
})
