<script setup lang="ts">
import { onMounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useUserStore } from '@/stores/user'

const taskStore = useTaskStore()
const userStore = useUserStore()

onMounted(async () => {
	await Promise.all([taskStore.fetchStats(), userStore.fetchUsers()])
})
</script>

<template>
	<div>
		<h1 class="text-2xl font-bold text-gray-800 mb-6">数据概览</h1>

		<!-- 统计卡片 -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			<div class="bg-white rounded-lg shadow p-6">
				<div class="text-sm text-gray-500 mb-1">总任务数</div>
				<div class="text-3xl font-bold text-gray-800">{{ taskStore.stats?.total || 0 }}</div>
			</div>

			<div class="bg-white rounded-lg shadow p-6">
				<div class="text-sm text-gray-500 mb-1">待办任务</div>
				<div class="text-3xl font-bold text-yellow-600">{{ taskStore.stats?.byStatus?.todo || 0 }}</div>
			</div>

			<div class="bg-white rounded-lg shadow p-6">
				<div class="text-sm text-gray-500 mb-1">进行中</div>
				<div class="text-3xl font-bold text-blue-600">{{ taskStore.stats?.byStatus?.in_progress || 0 }}</div>
			</div>

			<div class="bg-white rounded-lg shadow p-6">
				<div class="text-sm text-gray-500 mb-1">已完成</div>
				<div class="text-3xl font-bold text-green-600">{{ taskStore.stats?.byStatus?.done || 0 }}</div>
			</div>
		</div>

		<!-- 快捷入口 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-lg font-semibold text-gray-800 mb-4">任务管理</h2>
				<p class="text-gray-600 mb-4">创建和管理任务，分配给团队成员</p>
				<router-link
					to="/admin/tasks"
					class="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
				>
					前往任务管理
				</router-link>
			</div>

			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-lg font-semibold text-gray-800 mb-4">用户管理</h2>
				<p class="text-gray-600 mb-4">管理团队成员和权限</p>
				<router-link
					to="/admin/users"
					class="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
				>
					前往用户管理
				</router-link>
			</div>
		</div>
	</div>
</template>
