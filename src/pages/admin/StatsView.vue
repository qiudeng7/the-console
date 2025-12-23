<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useUserStore } from '@/stores/user'

const taskStore = useTaskStore()
const userStore = useUserStore()

const statusOptions: { value: string; label: string; color: string }[] = [
	{ value: 'todo', label: '待办', color: 'bg-yellow-100 text-yellow-800' },
	{ value: 'in_progress', label: '进行中', color: 'bg-blue-100 text-blue-800' },
	{ value: 'in_review', label: '审核中', color: 'bg-purple-100 text-purple-800' },
	{ value: 'done', label: '已完成', color: 'bg-green-100 text-green-800' },
	{ value: 'cancelled', label: '已取消', color: 'bg-gray-100 text-gray-800' }
]

// 任务完成率
const completionRate = computed(() => {
	const stats = taskStore.stats
	if (!stats || stats.total === 0) return 0
	return Math.round((stats.byStatus?.done || 0) / stats.total * 100)
})

// 获取用户邮箱
function getUserEmail(userId: number) {
	const user = userStore.users.find((u) => u.id === userId)
	return user?.email || `用户 #${userId}`
}

onMounted(async () => {
	await Promise.all([taskStore.fetchStats(), userStore.fetchUsers()])
})
</script>

<template>
	<div>
		<h1 class="text-2xl font-bold text-gray-800 mb-6">数据统计</h1>

		<!-- 任务完成率 -->
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<h2 class="text-lg font-semibold text-gray-800 mb-4">任务完成率</h2>
			<div class="flex items-center gap-4">
				<div class="flex-1">
					<div class="flex justify-between text-sm text-gray-600 mb-2">
						<span>完成进度</span>
						<span>{{ completionRate }}%</span>
					</div>
					<div class="w-full bg-gray-200 rounded-full h-4">
						<div
							class="bg-green-600 h-4 rounded-full transition-all"
							:style="{ width: completionRate + '%' }"
						></div>
					</div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- 任务状态分布 -->
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-lg font-semibold text-gray-800 mb-4">任务状态分布</h2>
				<div class="space-y-3">
					<div
						v-for="status in statusOptions"
						:key="status.value"
						class="flex items-center justify-between"
					>
						<span class="text-sm text-gray-600">{{ status.label }}</span>
						<span class="text-sm font-medium text-gray-900">
							{{ taskStore.stats?.byStatus?.[status.value] || 0 }}
						</span>
					</div>
				</div>
			</div>

			<!-- 任务分类分布 -->
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-lg font-semibold text-gray-800 mb-4">任务分类分布</h2>
				<div
					v-if="Object.keys(taskStore.stats?.byCategory || {}).length === 0"
					class="text-sm text-gray-500"
				>
					暂无分类数据
				</div>
				<div v-else class="space-y-3">
					<div
						v-for="(count, category) in taskStore.stats?.byCategory"
						:key="category"
						class="flex items-center justify-between"
					>
						<span class="text-sm text-gray-600">{{ category }}</span>
						<span class="text-sm font-medium text-gray-900">{{ count }}</span>
					</div>
				</div>
			</div>

			<!-- 员工工作量 -->
			<div class="bg-white rounded-lg shadow p-6 lg:col-span-2">
				<h2 class="text-lg font-semibold text-gray-800 mb-4">员工工作量</h2>
				<div
					v-if="Object.keys(taskStore.stats?.byAssignee || {}).length === 0"
					class="text-sm text-gray-500"
				>
					暂无分配数据
				</div>
				<div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<div
						v-for="(count, userId) in taskStore.stats?.byAssignee"
						:key="userId"
						class="border border-gray-200 rounded-lg p-4"
					>
						<div class="text-sm text-gray-600 mb-1">{{ getUserEmail(Number(userId)) }}</div>
						<div class="text-2xl font-bold text-gray-900">{{ count }}</div>
						<div class="text-xs text-gray-500">个任务</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
