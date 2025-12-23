<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

function handleLogout() {
	authStore.logout()
	router.push('/login')
}
</script>

<template>
	<div class="min-h-screen bg-gray-50">
		<!-- 顶部导航 -->
		<nav class="bg-white shadow-sm border-b border-gray-200">
			<div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<h1 class="text-xl font-bold text-gray-800">员工工作台</h1>
					<span class="text-xs text-gray-400">The Console</span>
				</div>
				<div class="flex items-center gap-4">
					<div class="text-sm text-gray-600">
						{{ authStore.user?.email }}
						<span class="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">员工</span>
					</div>
					<button
						@click="handleLogout"
						class="text-gray-600 hover:text-gray-900 text-sm"
					>
						退出登录
					</button>
				</div>
			</div>
		</nav>

		<!-- 主内容区 -->
		<main class="max-w-6xl mx-auto px-4 py-8">
			<RouterView />
		</main>
	</div>
</template>
