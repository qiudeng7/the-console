<script setup lang="ts">
import { useAuthStore } from '~~/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
  // 已登录跳转到 dashboard，未登录跳转到登录页
  if (authStore.isAuthenticated) {
    if (authStore.isAdmin) {
      router.replace('/admin/dashboard')
    } else {
      router.replace('/employee/tasks')
    }
  } else {
    router.replace('/login')
  }
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
