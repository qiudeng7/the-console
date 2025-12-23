<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTaskStore } from '@/stores/task'
import type { TaskStatus } from '@/types/task'

const taskStore = useTaskStore()

const statusFilter = ref<TaskStatus | ''>('')

// 状态选项
const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
	{ value: 'todo', label: '待办', color: 'bg-yellow-100 text-yellow-800' },
	{ value: 'in_progress', label: '进行中', color: 'bg-blue-100 text-blue-800' },
	{ value: 'in_review', label: '审核中', color: 'bg-purple-100 text-purple-800' },
	{ value: 'done', label: '已完成', color: 'bg-green-100 text-green-800' },
	{ value: 'cancelled', label: '已取消', color: 'bg-gray-100 text-gray-800' }
]

// 筛选后的任务列表
const filteredTasks = computed(() => {
	if (!statusFilter.value) return taskStore.tasks
	return taskStore.tasks.filter((t) => t.status === statusFilter.value)
})

// 获取状态显示
function getStatusInfo(status: TaskStatus) {
	return statusOptions.find((s) => s.value === status) || statusOptions[0]
}

// 更新任务状态
async function handleUpdateStatus(id: number, status: TaskStatus) {
	await taskStore.updateTask(id, { status })
}

onMounted(async () => {
	await taskStore.fetchTasks()
})
</script>

<template>
	<div>
		<!-- 标题 -->
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-gray-800">我的任务</h1>
			<p class="text-gray-600 mt-1">查看和管理分配给您的任务</p>
		</div>

		<!-- 状态筛选 -->
		<div class="bg-white rounded-lg shadow p-4 mb-6">
			<div class="flex flex-wrap gap-2">
				<button
					v-for="status in statusOptions"
					:key="status.value"
					@click="statusFilter = statusFilter === status.value ? '' : status.value"
					class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
					:class="
						statusFilter === status.value
							? 'bg-gray-900 text-white'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
					"
				>
					{{ status.label }} ({{ taskStore.tasks.filter((t) => t.status === status.value).length }})
				</button>
			</div>
		</div>

		<!-- 任务列表 -->
		<div class="space-y-4">
			<div v-if="filteredTasks.length === 0" class="text-center py-12 text-gray-500">
				暂无任务
			</div>

			<div
				v-for="task in filteredTasks"
				:key="task.id"
				class="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
			>
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<div class="flex items-center gap-3 mb-2">
							<h3 class="text-lg font-semibold text-gray-900">{{ task.title }}</h3>
							<span
								class="px-2 py-1 text-xs rounded"
								:class="getStatusInfo(task.status).color"
							>
								{{ getStatusInfo(task.status).label }}
							</span>
						</div>

						<p v-if="task.description" class="text-gray-600 mb-4">{{ task.description }}</p>

						<div class="flex flex-wrap gap-2 text-sm">
							<span v-if="task.category" class="text-gray-500">
								分类: {{ task.category }}
							</span>
							<span v-if="task.tag" class="text-gray-500">
								标签: {{ task.tag }}
							</span>
							<span class="text-gray-400">
								创建于 {{ task.createdAt }}
							</span>
						</div>
					</div>

					<div class="ml-4">
						<select
							:value="task.status"
							@change="handleUpdateStatus(task.id, $event.target.value as TaskStatus)"
							class="text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
						>
							<option v-for="s in statusOptions" :key="s.value" :value="s.value">
								{{ s.label }}
							</option>
						</select>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
