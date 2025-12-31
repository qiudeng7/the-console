<script setup lang="ts">
// 根应用组件
</script>

<template>
  <div class="color-mode">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
.color-mode {
  min-height: 100vh;
}
</style>
