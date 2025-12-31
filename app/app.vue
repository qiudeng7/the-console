<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
  // 如果已登录，根据角色跳转
  if (authStore.isAuthenticated) {
    if (authStore.isAdmin) {
      router.replace('/admin/tasks')
    } else {
      router.replace('/employee/tasks')
    }
  } else {
    // 未登录跳转到登录页
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
