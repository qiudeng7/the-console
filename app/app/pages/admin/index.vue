<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  requiresAdmin: true
})

const router = useRouter()

onMounted(() => {
  router.replace('/admin/dashboard')
})
</script>

<template>
  <div></div>
</template>
