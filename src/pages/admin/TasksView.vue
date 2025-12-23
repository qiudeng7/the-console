<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useUserStore } from '@/stores/user'
import type { Task, TaskStatus } from '@/types/task'

const taskStore = useTaskStore()
const userStore = useUserStore()

const searchQuery = ref('')
const statusFilter = ref<TaskStatus | ''>('')
const showCreateModal = ref(false)
const newTaskForm = ref({
	title: '',
	category: '',
	tag: '',
	description: '',
	status: 'todo' as TaskStatus,
	assignedToUserId: null as number | null
})

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
	let tasks = taskStore.tasks

	if (searchQuery.value) {
		const query = searchQuery.value.toLowerCase()
		tasks = tasks.filter(
			(t) =>
				t.title.toLowerCase().includes(query) ||
				t.description?.toLowerCase().includes(query)
		)
	}

	if (statusFilter.value) {
		tasks = tasks.filter((t) => t.status === statusFilter.value)
	}

	return tasks
})

// 获取状态显示
function getStatusInfo(status: TaskStatus) {
	return statusOptions.find((s) => s.value === status) || statusOptions[0]
}

// 加载数据
onMounted(async () => {
	await Promise.all([taskStore.fetchTasks(), userStore.fetchUsers()])
})

// 创建任务
async function handleCreateTask() {
	if (!newTaskForm.value.title) return

	await taskStore.createTask({
		title: newTaskForm.value.title,
		category: newTaskForm.value.category || null,
		tag: newTaskForm.value.tag || null,
		description: newTaskForm.value.description || null,
		status: newTaskForm.value.status,
		assignedToUserId: newTaskForm.value.assignedToUserId
	})

	showCreateModal.value = false
	newTaskForm.value = {
		title: '',
		category: '',
		tag: '',
		description: '',
		status: 'todo',
		assignedToUserId: null
	}
}

// 删除任务
async function handleDeleteTask(id: number) {
	if (confirm('确定要删除这个任务吗？')) {
		await taskStore.deleteTask(id)
	}
}

// 更新任务状态
async function handleUpdateStatus(id: number, status: TaskStatus) {
	await taskStore.updateTask(id, { status })
}
</script>

<template>
	<div>
		<!-- 标题和操作栏 -->
		<div class="flex items-center justify-between mb-6">
			<h1 class="text-2xl font-bold text-gray-800">任务管理</h1>
			<button
				@click="showCreateModal = true"
				class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
			>
				+ 创建任务
			</button>
		</div>

		<!-- 筛选器 -->
		<div class="bg-white rounded-lg shadow p-4 mb-6">
			<div class="flex gap-4">
				<input
					v-model="searchQuery"
					type="text"
					placeholder="搜索任务..."
					class="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>

				<select
					v-model="statusFilter"
					class="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">全部状态</option>
					<option v-for="s in statusOptions" :key="s.value" :value="s.value">
						{{ s.label }}
					</option>
				</select>
			</div>
		</div>

		<!-- 任务列表 -->
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							任务
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							分类
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							状态
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							执行人
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							操作
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					<tr v-if="filteredTasks.length === 0">
						<td colspan="5" class="px-6 py-4 text-center text-gray-500">暂无任务</td>
					</tr>
					<tr v-for="task in filteredTasks" :key="task.id" class="hover:bg-gray-50">
						<td class="px-6 py-4">
							<div class="text-sm font-medium text-gray-900">{{ task.title }}</div>
							<div class="text-sm text-gray-500 truncate max-w-xs">{{ task.description }}</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span class="text-sm text-gray-900">{{ task.category || '-' }}</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<select
								:value="task.status"
								@change="handleUpdateStatus(task.id, $event.target.value as TaskStatus)"
								class="text-xs px-2 py-1 rounded border-0 cursor-pointer"
								:class="getStatusInfo(task.status).color"
							>
								<option v-for="s in statusOptions" :key="s.value" :value="s.value">
									{{ s.label }}
								</option>
							</select>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{{ task.assignedToUserId ? `用户 #${task.assignedToUserId}` : '未分配' }}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm">
							<button
								@click="handleDeleteTask(task.id)"
								class="text-red-600 hover:text-red-900"
							>
								删除
							</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- 创建任务弹窗 -->
		<div
			v-if="showCreateModal"
			class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		>
			<div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
				<div class="flex items-center justify-between p-6 border-b">
					<h2 class="text-xl font-bold">创建任务</h2>
					<button @click="showCreateModal = false" class="text-gray-400 hover:text-gray-600">
						✕
					</button>
				</div>

				<form @submit.prevent="handleCreateTask" class="p-6 space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
						<input
							v-model="newTaskForm.title"
							type="text"
							required
							class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
						<input
							v-model="newTaskForm.category"
							type="text"
							class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
						<textarea
							v-model="newTaskForm.description"
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">执行人</label>
						<select
							v-model="newTaskForm.assignedToUserId"
							class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option :value="null">未分配</option>
							<option v-for="user in userStore.users" :key="user.id" :value="user.id">
								{{ user.email }} ({{ user.role === 'admin' ? '管理员' : '员工' }})
							</option>
						</select>
					</div>

					<div class="flex justify-end gap-3 pt-4">
						<button
							type="button"
							@click="showCreateModal = false"
							class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
						>
							取消
						</button>
						<button
							type="submit"
							class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
						>
							创建
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>
