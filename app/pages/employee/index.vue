<script setup lang="ts">
definePageMeta({
  layout: 'employee'
})

const router = useRouter()

onMounted(() => {
  router.replace('/employee/tasks')
})
</script>

<template>
  <div></div>
</template>
