<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTaskStore } from '@/stores/task'
import type { TaskStatus } from '@/types/task'
import type { Task } from '@/types/task'

const taskStore = useTaskStore()

const statusFilter = ref<TaskStatus | ''>('')
const selectedTask = ref<Task | null>(null)
const showDetailModal = ref(false)

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

// 查看任务详情
function handleViewDetail(task: Task) {
	selectedTask.value = task
	showDetailModal.value = true
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

						<p v-if="task.description" class="text-gray-600 mb-4 line-clamp-2">
							{{ task.description }}
						</p>

						<div class="flex flex-wrap gap-2 text-sm text-gray-500">
							<span v-if="task.category">
								分类: {{ task.category }}
							</span>
							<span v-if="task.tag">
								标签: {{ task.tag }}
							</span>
							<span class="text-gray-400">
								创建于 {{ task.createdAt }}
							</span>
						</div>
					</div>

					<div class="ml-4">
						<button
							@click="handleViewDetail(task)"
							class="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
						>
							查看详情
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- 任务详情弹窗 -->
		<div
			v-if="showDetailModal && selectedTask"
			class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		>
			<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
				<div class="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
					<h2 class="text-xl font-bold">任务详情</h2>
					<button @click="showDetailModal = false" class="text-gray-400 hover:text-gray-600">
						✕
					</button>
				</div>

				<div class="p-6 space-y-6">
					<!-- 标题和状态 -->
					<div class="flex items-center gap-3">
						<h3 class="text-2xl font-bold text-gray-900">{{ selectedTask.title }}</h3>
						<span
							class="px-3 py-1 text-sm rounded"
							:class="getStatusInfo(selectedTask.status).color"
						>
							{{ getStatusInfo(selectedTask.status).label }}
						</span>
					</div>

					<!-- 描述 -->
					<div v-if="selectedTask.description">
						<h4 class="text-sm font-medium text-gray-700 mb-2">任务描述</h4>
						<p class="text-gray-600">{{ selectedTask.description }}</p>
					</div>

					<!-- 元信息 -->
					<div class="grid grid-cols-2 gap-4">
						<div v-if="selectedTask.category">
							<h4 class="text-sm font-medium text-gray-700 mb-1">分类</h4>
							<p class="text-gray-900">{{ selectedTask.category }}</p>
						</div>
						<div v-if="selectedTask.tag">
							<h4 class="text-sm font-medium text-gray-700 mb-1">标签</h4>
							<p class="text-gray-900">{{ selectedTask.tag }}</p>
						</div>
						<div>
							<h4 class="text-sm font-medium text-gray-700 mb-1">创建时间</h4>
							<p class="text-gray-900">{{ selectedTask.createdAt }}</p>
						</div>
						<div>
							<h4 class="text-sm font-medium text-gray-700 mb-1">更新时间</h4>
							<p class="text-gray-900">{{ selectedTask.updatedAt }}</p>
						</div>
					</div>
				</div>

				<div class="flex justify-end p-6 border-t bg-gray-50">
					<button
						@click="showDetailModal = false"
						class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
					>
						关闭
					</button>
				</div>
			</div>
		</div>
	</div>
</template>
