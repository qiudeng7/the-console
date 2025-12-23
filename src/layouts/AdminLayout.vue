<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

function handleLogout() {
	authStore.logout()
	router.push('/login')
}

const menuItems = [
	{ path: '/admin/dashboard', label: 'Dashboard', icon: '' },
	{ path: '/admin/tasks', label: '任务管理', icon: '' },
	{ path: '/admin/users', label: '用户管理', icon: '' },
	{ path: '/admin/stats', label: '数据统计', icon: '' }
]
</script>

<template>
	<div class="flex h-screen bg-gray-100">
		<!-- 侧边栏 -->
		<aside class="w-64 bg-gray-900 text-white flex flex-col">
			<div class="p-6 border-b border-gray-800">
				<h1 class="text-xl font-bold">管理后台</h1>
				<p class="text-xs text-gray-400 mt-1">The Console Admin</p>
			</div>

			<nav class="flex-1 py-6">
				<RouterLink
					v-for="item in menuItems"
					:key="item.path"
					:to="item.path"
					class="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
					active-class="bg-gray-800 text-white border-r-4 border-blue-500"
				>
					{{ item.label }}
				</RouterLink>
			</nav>
		</aside>

		<!-- 主内容区 -->
		<div class="flex-1 flex flex-col overflow-hidden">
			<!-- 顶部栏 -->
			<header class="bg-white shadow-sm h-16 flex items-center justify-between px-6">
				<div class="text-sm text-gray-500">
					<span class="font-medium text-gray-700">{{ authStore.user?.email }}</span>
					<span class="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">管理员</span>
				</div>
				<button
					@click="handleLogout"
					class="text-gray-600 hover:text-gray-900 text-sm"
				>
					退出登录
				</button>
			</header>

			<!-- 页面内容 -->
			<main class="flex-1 overflow-auto p-6">
				<RouterView />
			</main>
		</div>
	</div>
</template>
