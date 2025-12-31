// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', 'pinia-plugin-persistedstate'],

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    databasePath: process.env.DATABASE_PATH || './database.sqlite',
    public: {
      apiBase: process.env.API_BASE || '/api'
    }
  },

  typescript: {
    strict: true,
    typeCheck: true,
    tsConfig: {
      compilerOptions: {
        strictNullChecks: true,
        noUncheckedIndexedAccess: true,
        noImplicitOverride: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        forceConsistentCasingInFileNames: true,
        skipLibCheck: true
      }
    }
  },

  nitro: {
    experimental: {
      openAPI: true
    }
  },

  imports: {
    dirs: ['app/stores']
  }
})
