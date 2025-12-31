<script setup lang="ts">
import type { Task, TaskListParams } from '~~/types'

definePageMeta({
  layout: 'employee'
})

import { useTaskStore } from '~~/app/stores/task'

const taskStore = useTaskStore()

const filters = reactive<TaskListParams>({
  page: 1,
  pageSize: 10,
  status: undefined,
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

const selectedTask = ref<Task | null>(null)
const showDetailModal = ref(false)

async function loadTasks() {
  await taskStore.fetchTasks(filters)
}

function openDetailModal(task: Task) {
  selectedTask.value = task
  showDetailModal.value = true
}

function getStatusLabel(status: string) {
  return statusOptions.find(s => s.value === status)?.label || status
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    todo: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    in_review: 'bg-purple-100 text-purple-800',
    done: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

onMounted(() => {
  loadTasks()
})
</script>

<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">我的任务</h1>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">状态</label>
            <select
              v-model="filters.status"
              @change="loadTasks"
              class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">搜索</label>
            <input
              v-model="filters.search"
              @keyup.enter="loadTasks"
              type="text"
              placeholder="搜索标题或描述"
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div v-if="taskStore.loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>

        <div v-else-if="taskStore.tasks.length === 0" class="text-center py-12">
          <p class="text-gray-500 dark:text-gray-400">暂无任务</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <div
            v-for="task in taskStore.tasks"
            :key="task.id"
            @click="openDetailModal(task)"
            class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">{{ task.title }}</h3>
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getStatusColor(task.status)">
                {{ getStatusLabel(task.status) }}
              </span>
            </div>
            <p v-if="task.description" class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
              {{ task.description }}
            </p>
            <div class="flex items-center text-xs text-gray-400 dark:text-gray-500">
              <span v-if="task.category" class="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded mr-2">
                {{ task.category }}
              </span>
              <span>{{ task.createdAt }}</span>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700 dark:text-gray-300">
              共 {{ taskStore.total }} 条记录
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Detail Modal -->
    <div v-if="showDetailModal && selectedTask" class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showDetailModal = false"></div>
        <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">{{ selectedTask.title }}</h3>
            <div class="space-y-3">
              <div class="flex items-center">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-20">状态：</span>
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getStatusColor(selectedTask.status)">
                  {{ getStatusLabel(selectedTask.status) }}
                </span>
              </div>
              <div v-if="selectedTask.category" class="flex items-center">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-20">分类：</span>
                <span class="text-sm text-gray-900 dark:text-gray-100">{{ selectedTask.category }}</span>
              </div>
              <div v-if="selectedTask.tag" class="flex items-center">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-20">标签：</span>
                <span class="text-sm text-gray-900 dark:text-gray-100">{{ selectedTask.tag }}</span>
              </div>
              <div class="flex items-center">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-20">创建时间：</span>
                <span class="text-sm text-gray-900 dark:text-gray-100">{{ selectedTask.createdAt }}</span>
              </div>
              <div v-if="selectedTask.description" class="mt-4">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">描述：</span>
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{{ selectedTask.description }}</p>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="button" @click="showDetailModal = false" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 sm:mt-0 sm:w-auto sm:text-sm">
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
