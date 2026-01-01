<script setup lang="ts">
import type { Task, TaskStatus } from '~~/types'

interface Props {
  task: Task
}

const props = defineProps<Props>()

const statusLabels: Record<TaskStatus, string> = {
  todo: '待办',
  in_progress: '进行中',
  in_review: '审核中',
  done: '已完成',
  cancelled: '已取消'
}

const statusColors: Record<TaskStatus, string> = {
  todo: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
    <div class="flex items-start justify-between mb-4">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ task.title }}</h2>
        <div class="mt-2 flex items-center space-x-2">
          <span
            v-if="task.category"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
          >
            {{ task.category }}
          </span>
          <span
            v-if="task.tag"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
          >
            {{ task.tag }}
          </span>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            :class="statusColors[task.status]"
          >
            {{ statusLabels[task.status] }}
          </span>
        </div>
      </div>
    </div>

    <!-- Description -->
    <div v-if="task.description" class="mt-4">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">任务描述</h3>
      <div class="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
        <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ task.description }}</p>
      </div>
    </div>

    <!-- Meta Information -->
    <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
      <div>
        <span class="font-medium text-gray-700 dark:text-gray-300">创建时间：</span>
        <span class="text-gray-600 dark:text-gray-400">{{ formatDate(task.createdAt) }}</span>
      </div>
      <div>
        <span class="font-medium text-gray-700 dark:text-gray-300">更新时间：</span>
        <span class="text-gray-600 dark:text-gray-400">{{ formatDate(task.updatedAt) }}</span>
      </div>
    </div>
  </div>
</template>
