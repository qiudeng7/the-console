<script setup lang="ts">
import { useAuthStore } from '~~/app/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
  // 根据用户身份跳转到对应页面
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
  <div class="min-h-screen flex items-center justify-center">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
</template>
