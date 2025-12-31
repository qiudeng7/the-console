<script setup lang="ts">
import type { Task, TaskListParams } from '~~/types'

definePageMeta({
  layout: 'admin',
  requiresAdmin: true
})

import { useTaskStore } from '~~/app/stores/task'

const taskStore = useTaskStore()

const filters = reactive<TaskListParams>({
  page: 1,
  pageSize: 10,
  status: undefined,
  category: '',
  search: ''
})

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'todo', label: '待办' },
  { value: 'in_progress', label: '进行中' },
  { value: 'in_review', label: '审核中' },
  { value: 'done', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedTask = ref<Task | null>(null)

const newTask = reactive({
  title: '',
  category: '',
  tag: '',
  description: '',
  assignedToUserId: null as number | null
})

async function loadTasks() {
  await taskStore.fetchTasks(filters)
}

async function handleCreateTask() {
  try {
    await taskStore.createTask(newTask)
    showCreateModal.value = false
    Object.assign(newTask, {
      title: '',
      category: '',
      tag: '',
      description: '',
      assignedToUserId: null
    })
    await loadTasks()
  } catch (e: any) {
    alert(e.message || '创建任务失败')
  }
}

async function handleUpdateTask() {
  if (!selectedTask.value) return

  try {
    await taskStore.updateTask(selectedTask.value.id, {
      status: selectedTask.value.status
    })
    showEditModal.value = false
    selectedTask.value = null
    await loadTasks()
  } catch (e: any) {
    alert(e.message || '更新任务失败')
  }
}

async function handleDeleteTask(taskId: number) {
  if (!confirm('确定要删除这个任务吗？')) return

  try {
    await taskStore.deleteTask(taskId)
    await loadTasks()
  } catch (e: any) {
    alert(e.message || '删除任务失败')
  }
}

function openEditModal(task: Task) {
  selectedTask.value = { ...task }
  showEditModal.value = true
}

function getStatusLabel(status: string) {
  return statusOptions.find(s => s.value === status)?.label || status
}

onMounted(() => {
  loadTasks()
})
</script>

<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">任务管理</h1>
        <button
          @click="showCreateModal = true"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          创建任务
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white shadow rounded-lg p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              v-model="filters.status"
              @change="loadTasks"
              class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option
                v-for="option in statusOptions"
                :key="option.value"
                :value="option.value || undefined"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <input
              v-model="filters.category"
              @keyup.enter="loadTasks"
              type="text"
              placeholder="输入分类"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">搜索</label>
            <input
              v-model="filters.search"
              @keyup.enter="loadTasks"
              type="text"
              placeholder="搜索标题或描述"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
          </div>
          <div class="flex items-end">
            <button
              @click="loadTasks"
              class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      <!-- Task List -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div v-if="taskStore.loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>

        <div v-else-if="taskStore.tasks.length === 0" class="text-center py-12">
          <p class="text-gray-500">暂无任务</p>
        </div>

        <table v-else class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="task in taskStore.tasks" :key="task.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ task.title }}</div>
                <div v-if="task.description" class="text-sm text-gray-500 truncate max-w-xs">
                  {{ task.description }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {{ getStatusLabel(task.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ task.category || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ task.createdAt }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="openEditModal(task)" class="text-indigo-600 hover:text-indigo-900 mr-4">
                  编辑
                </button>
                <button @click="handleDeleteTask(task.id)" class="text-red-600 hover:text-red-900">
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
              共 {{ taskStore.total }} 条记录
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Task Modal -->
    <div v-if="showCreateModal" class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showCreateModal = false"></div>
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form @submit.prevent="handleCreateTask">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 class="text-lg font-medium text-gray-900 mb-4">创建新任务</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">标题 *</label>
                  <input v-model="newTask.title" required type="text" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">分类</label>
                  <input v-model="newTask.category" type="text" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">标签</label>
                  <input v-model="newTask.tag" type="text" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">描述</label>
                  <textarea v-model="newTask.description" rows="3" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button type="submit" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm">
                创建
              </button>
              <button type="button" @click="showCreateModal = false" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Task Modal -->
    <div v-if="showEditModal && selectedTask" class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showEditModal = false"></div>
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form @submit.prevent="handleUpdateTask">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 class="text-lg font-medium text-gray-900 mb-4">编辑任务</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">标题</label>
                  <input v-model="selectedTask.title" type="text" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">状态</label>
                  <select v-model="selectedTask.status" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option v-for="option in statusOptions.filter(o => o.value)" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button type="submit" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm">
                保存
              </button>
              <button type="button" @click="showEditModal = false" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
